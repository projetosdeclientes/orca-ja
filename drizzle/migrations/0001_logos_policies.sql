
CREATE POLICY "logos_leitura_membros" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'logos' AND public.pode_acessar_empresa(((storage.foldername(name))[1])::uuid));
CREATE POLICY "logos_inserir_dono" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND public.pode_configurar_empresa(((storage.foldername(name))[1])::uuid));
CREATE POLICY "logos_alterar_dono" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND public.pode_configurar_empresa(((storage.foldername(name))[1])::uuid))
  WITH CHECK (bucket_id = 'logos' AND public.pode_configurar_empresa(((storage.foldername(name))[1])::uuid));
CREATE POLICY "logos_excluir_dono" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND public.pode_configurar_empresa(((storage.foldername(name))[1])::uuid));
