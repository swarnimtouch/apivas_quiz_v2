-- ============================================================
-- Stroke Awareness Quiz - Database Schema
-- Database Name: microlabs_quiz
-- ============================================================

CREATE DATABASE IF NOT EXISTS `microlabs_quiz` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `microlabs_quiz`;

-- 1. Table: quiz_visitors (Tracks visitors, language used, Play Game & Let's Begin clicks)
CREATE TABLE IF NOT EXISTS `quiz_visitors` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `language_code` VARCHAR(10) NOT NULL DEFAULT 'en',
    `play_game_clicked` TINYINT(1) NOT NULL DEFAULT 0,
    `lets_begin_clicked` TINYINT(1) NOT NULL DEFAULT 0,
    `first_seen` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_seen` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_lang` (`user_id`, `language_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table: quiz_answers (Tracks Question 1 to 5 Yes/No answers per user & language)
CREATE TABLE IF NOT EXISTS `quiz_answers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `question_num` TINYINT NOT NULL,
    `answer_choice` ENUM('yes', 'no') NOT NULL,
    `language_code` VARCHAR(10) NOT NULL DEFAULT 'en',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_lang_q` (`user_id`, `language_code`, `question_num`),
    INDEX `idx_q_lang_ans` (`question_num`, `language_code`, `answer_choice`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table: quiz_finish_clicks (Tracks Emergency / Finish clicks per user & language)
CREATE TABLE IF NOT EXISTS `quiz_finish_clicks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `language_code` VARCHAR(10) NOT NULL DEFAULT 'en',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_lang` (`user_id`, `language_code`),
    INDEX `idx_finish_lang` (`language_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table: quiz_stats (Summary table)
CREATE TABLE IF NOT EXISTS `quiz_stats` (
    `metric_name` VARCHAR(50) NOT NULL PRIMARY KEY,
    `total_count` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
