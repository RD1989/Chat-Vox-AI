-- RPC para Rate Limiting Otimizado (Controle de Limites do Chat Vox)
-- Esta função atuará como um "Token Bucket" atômico rodando nativamente no nível do banco.
-- Sem isso, o Node.js/Deno gastaria tempo de rede abrindo a tabela `vox_rate_limits`.

CREATE OR REPLACE FUNCTION check_strict_rate_limit(
  p_ip_address TEXT,
  p_user_id UUID,
  p_max_requests INT DEFAULT 30,
  p_window_minutes INT DEFAULT 1
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Roda como admin ignorando RLS por performance
AS $$
DECLARE
  v_request_count INT;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Definir a janela de tempo de bloqueio (Ex: Do último 1 minuto até agora)
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Limpar requests muito antigas silenciosamente para não onerar armazenamento (Housekeeping)
  DELETE FROM vox_rate_limits
  WHERE window_start < (NOW() - INTERVAL '1 hour')
  AND ip_address = p_ip_address;

  -- Checar quantos contadores existem nesta janela de tempo exata
  SELECT COUNT(*)
  INTO v_request_count
  FROM vox_rate_limits
  WHERE ip_address = p_ip_address
    AND user_id = p_user_id
    AND window_start >= v_window_start;

  -- Se o cliente já superou o limite, retorna FALSO (Bloqueado)
  IF v_request_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  -- Se tiver limite disponível, injeta este NOVO request atômicamente
  INSERT INTO vox_rate_limits (ip_address, user_id, window_start)
  VALUES (p_ip_address, p_user_id, NOW());

  -- Retorna VERDADEIRO (Acesso Liberado)
  RETURN TRUE;
END;
$$;
