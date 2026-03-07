CREATE OR REPLACE FUNCTION notify_chatbot_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_other_user UUID;
  v_other_role TEXT;
  v_bot_enabled BOOLEAN;
BEGIN
  SELECT user_id INTO v_other_user
  FROM chat_participants
  WHERE room_id = NEW.room_id AND user_id != NEW.sender_id
  LIMIT 1;

  IF v_other_user IS NULL THEN RETURN NEW; END IF;

  SELECT role INTO v_other_role FROM profiles WHERE id = v_other_user;
  IF v_other_role != 'company' THEN RETURN NEW; END IF;

  SELECT enabled INTO v_bot_enabled
  FROM company_bot_settings WHERE company_id = v_other_user;

  IF v_bot_enabled = true THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/api/company-bot/respond',
      body := json_build_object(
        'room_id', NEW.room_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'company_id', v_other_user
      )::text,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_chatbot_on_message();
