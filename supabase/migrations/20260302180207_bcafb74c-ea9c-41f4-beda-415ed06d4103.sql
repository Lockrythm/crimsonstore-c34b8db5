
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow inserts via trigger (security definer function)
-- We need a function to create notifications

-- Function: notify admins when a new product is submitted
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  seller_name TEXT;
BEGIN
  -- Get seller username
  SELECT username INTO seller_name FROM public.profiles WHERE id = NEW.seller_id;
  
  -- Notify all admins
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, product_id)
    VALUES (
      admin_record.user_id,
      'New Submission for Approval',
      COALESCE(seller_name, 'A user') || ' submitted "' || NEW.title || '" for approval.',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger: on new product insert
CREATE TRIGGER on_product_submitted
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_product();

-- Function: notify seller when product status changes
CREATE OR REPLACE FUNCTION public.notify_seller_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when status actually changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, message, product_id)
      VALUES (
        NEW.seller_id,
        'Listing Approved!',
        'Your listing "' || NEW.title || '" has been approved and is now live.',
        NEW.id
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, message, product_id)
      VALUES (
        NEW.seller_id,
        'Listing Rejected',
        'Your listing "' || NEW.title || '" has been rejected.',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: on product status update
CREATE TRIGGER on_product_status_changed
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_on_status_change();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
