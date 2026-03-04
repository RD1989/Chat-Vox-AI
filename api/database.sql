-- Esquema Completo ChatVox para MySQL

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------

--
-- Estrutura da tabela `vox_users`
--

CREATE TABLE IF NOT EXISTS `vox_users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `profiles`
--

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` varchar(36) NOT NULL,
  `full_name` varchar(255) NOT NULL DEFAULT '',
  `avatar_url` text,
  `company_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `vox_settings`
--

CREATE TABLE IF NOT EXISTS `vox_settings` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `ai_name` varchar(255) NOT NULL DEFAULT 'Vox',
  `ai_avatar_url` text,
  `primary_color` varchar(20) NOT NULL DEFAULT '#6366f1',
  `welcome_message` text NOT NULL,
  `system_prompt` text,
  `ai_persona` text,
  `ai_tone` varchar(50) DEFAULT 'profissional',
  `ai_objective` text,
  `ai_restrictions` text,
  `ai_cta` text,
  `ai_qualification_question` text,
  `meta_pixel` varchar(100) DEFAULT NULL,
  `tiktok_pixel` varchar(100) DEFAULT NULL,
  `chat_theme` varchar(50) DEFAULT 'whatsapp',
  `chat_theme_config` json DEFAULT NULL,
  `voice_enabled` tinyint(1) DEFAULT 0,
  `voice_name` varchar(50) DEFAULT 'alloy',
  `voice_speed` decimal(3,2) DEFAULT 1.00,
  `voice_response_pct` int(11) DEFAULT 50,
  `voice_show_text` tinyint(1) DEFAULT 1,
  `voice_accent` varchar(20) DEFAULT 'pt-BR',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `vox_agents`
--

CREATE TABLE IF NOT EXISTS `vox_agents` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT 'Agente 1',
  `system_prompt` text,
  `ai_persona` text,
  `ai_tone` varchar(50) DEFAULT 'profissional',
  `ai_objective` text,
  `ai_restrictions` text,
  `ai_cta` text,
  `ai_qualification_question` text,
  `welcome_message` text NOT NULL,
  `ai_avatar_url` text,
  `primary_color` varchar(20) NOT NULL DEFAULT '#6366f1',
  `chat_theme` varchar(50) DEFAULT 'whatsapp',
  `chat_theme_config` json DEFAULT NULL,
  `custom_css` text,
  `voice_enabled` tinyint(1) DEFAULT 0,
  `voice_name` varchar(50) DEFAULT 'alloy',
  `voice_speed` decimal(3,2) DEFAULT 1.00,
  `voice_response_pct` int(11) DEFAULT 50,
  `voice_show_text` tinyint(1) DEFAULT 1,
  `voice_accent` varchar(20) DEFAULT 'pt-BR',
  `webhook_url` text,
  `widget_position` varchar(50) DEFAULT 'bottom-right',
  `widget_trigger_seconds` int(11) DEFAULT 5,
  `widget_trigger_scroll` int(11) DEFAULT 50,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `vox_leads`
--

CREATE TABLE IF NOT EXISTS `vox_leads` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `agent_id` varchar(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'novo',
  `source` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `utm_source` varchar(100) DEFAULT NULL,
  `utm_medium` varchar(100) DEFAULT NULL,
  `utm_campaign` varchar(100) DEFAULT NULL,
  `qualified` tinyint(1) NOT NULL DEFAULT 0,
  `qualification_score` int(11) DEFAULT 0,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `vox_messages`
--

CREATE TABLE IF NOT EXISTS `vox_messages` (
  `id` varchar(36) NOT NULL,
  `lead_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `agent_id` varchar(36) DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'user',
  `content` text NOT NULL,
  `message_type` varchar(50) NOT NULL DEFAULT 'text',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `vox_knowledge`
--

CREATE TABLE IF NOT EXISTS `vox_knowledge` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `agent_id` varchar(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `content` text NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'geral',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `vox_rate_limits`
--

CREATE TABLE IF NOT EXISTS `vox_rate_limits` (
  `id` varchar(36) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `request_count` int(11) NOT NULL DEFAULT 1,
  `window_start` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
