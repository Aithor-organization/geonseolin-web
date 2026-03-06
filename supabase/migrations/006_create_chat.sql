CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_participants (
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read rooms" ON public.chat_rooms FOR SELECT
  USING (EXISTS (SELECT 1 FROM chat_participants WHERE room_id = chat_rooms.id AND user_id = auth.uid()));
CREATE POLICY "Authenticated insert rooms" ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants read own entries" ON public.chat_participants FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM chat_participants cp WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid()
  ));
CREATE POLICY "Authenticated insert participants" ON public.chat_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update own last_read" ON public.chat_participants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Participants read messages" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM chat_participants WHERE room_id = messages.room_id AND user_id = auth.uid()));
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM chat_participants WHERE room_id = messages.room_id AND user_id = auth.uid()
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE INDEX idx_messages_room_id ON public.messages(room_id, created_at);
CREATE INDEX idx_chat_participants_user_id ON public.chat_participants(user_id);
