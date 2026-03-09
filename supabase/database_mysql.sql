-- Script de Migração Chat Vox: Supabase -> MySQL
-- Gerado por Antigravity para migração profissional

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. Tabela de Usuários (Substitui Auth.Users do Supabase)
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabela de Planos
CREATE TABLE IF NOT EXISTS `plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `price_brl` int(11) NOT NULL DEFAULT 0,
  `lead_limit` int(11) DEFAULT NULL,
  `agent_limit` int(11) DEFAULT 1,
  `request_limit` int(11) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserção de Planos Padrão
INSERT INTO `plans` (`slug`, `name`, `price_brl`, `lead_limit`, `agent_limit`, `request_limit`) VALUES
('free', 'Free', 0, 25, 1, 50),
('starter', 'Starter', 9790, 300, 1, 1000),
('pro', 'Pro', 19790, 3000, 3, 5000),
('scale', 'Scale', 39790, 10000, 100, NULL)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Tabela de Perfis
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) DEFAULT '',
  `avatar_url` text,
  `company_name` varchar(255),
  `plan` varchar(50) DEFAULT 'free',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabela de Configurações Globais (System Settings)
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL UNIQUE,
  `value` text,
  `description` text,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabela de Agentes AI (Vox Agents)
CREATE TABLE IF NOT EXISTS `vox_agents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT 'Agente Principal',
  `system_prompt` text,
  `welcome_message` text,
  `ai_avatar_url` text,
  `primary_color` varchar(20) DEFAULT '#6366f1',
  `chat_theme` varchar(50) DEFAULT 'whatsapp',
  `chat_theme_config` json DEFAULT NULL,
  `voice_enabled` boolean DEFAULT false,
  `webhook_url` text,
  `is_active` boolean DEFAULT true,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabela de Leads
CREATE TABLE IF NOT EXISTS `vox_leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `agent_id` int(11),
  `name` varchar(255) NOT NULL,
  `phone` varchar(50),
  `email` varchar(255),
  `status` varchar(50) DEFAULT 'novo',
  `source` varchar(100),
  `city` varchar(100),
  `region` varchar(100),
  `qualified` boolean DEFAULT false,
  `qualification_score` int(11) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`agent_id`) REFERENCES `vox_agents`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabela de Mensagens
CREATE TABLE IF NOT EXISTS `vox_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `agent_id` int(11),
  `role` varchar(50) NOT NULL,
  `content` text NOT NULL,
  `message_type` varchar(50) DEFAULT 'text',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lead_id`) REFERENCES `vox_leads`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS `vox_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plan_slug` varchar(50) NOT NULL,
  `amount_cents` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `pix_id` varchar(255),
  `pix_copiapasta` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Usuário Admin Inicial (Senha: admin123 - bcrypt seria necessário no PHP)
INSERT INTO `users` (`email`, `password`) VALUES ('admin@chatvox.io', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
INSERT INTO `profiles` (`user_id`, `full_name`, `plan`) VALUES (1, 'Administrador Chat Vox', 'scale');
