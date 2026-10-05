-- Explicit family policies use an init-plan for auth.uid(), preserving ownership semantics.
alter policy "parent reads own children" on public.children to authenticated using(parent_id=(select auth.uid()));
alter policy "parent inserts own children" on public.children to authenticated with check(parent_id=(select auth.uid()));
alter policy "parent updates own children" on public.children to authenticated using(parent_id=(select auth.uid())) with check(parent_id=(select auth.uid()));
alter policy "parent deletes own children" on public.children to authenticated using(parent_id=(select auth.uid()));
alter policy "parent reads own children screening" on public.screening_sessions to authenticated using(exists(select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())));
alter policy "parent inserts own children screening" on public.screening_sessions to authenticated with check(exists(select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())));
do $$ declare t text; begin
  foreach t in array array['learning_sessions','chunks_completed','quiz_results','practice_results'] loop
    execute format('alter policy "parent reads own children rows" on public.%I to authenticated using(exists(select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())))',t);
    execute format('alter policy "parent inserts own children rows" on public.%I to authenticated with check(exists(select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())))',t);
  end loop;
end $$;
alter policy "parent updates own children sessions" on public.learning_sessions to authenticated using(exists(select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid()))) with check(exists(select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())));
alter policy "parent reads own notification reads" on public.notification_reads to authenticated using(parent_id=(select auth.uid()));
alter policy "parent inserts own notification reads" on public.notification_reads to authenticated with check(parent_id=(select auth.uid()));
create index if not exists chunks_completed_session_child_idx on public.chunks_completed(session_id,child_id);
create index if not exists quiz_results_session_child_idx on public.quiz_results(session_id,child_id);
