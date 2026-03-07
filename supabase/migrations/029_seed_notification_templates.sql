INSERT INTO notification_templates (type, template, variables) VALUES
  ('application_accepted',
   E'🎉 [{job_title}]에 확정되셨습니다!\n{company_name}에서 회원님을 선택했습니다.\n담당자에게 메시지를 보내보세요.',
   ARRAY['job_title', 'company_name']),
  ('application_rejected',
   E'안타깝지만 [{job_title}] 지원이 마감되었습니다.\n다른 공고도 확인해보세요!',
   ARRAY['job_title', 'company_name']),
  ('auto_apply_result',
   E'🤖 AI가 오늘 {count}건의 공고에 지원했습니다.\n지원 내역을 확인해보세요.',
   ARRAY['count'])
ON CONFLICT (type) DO NOTHING;
