USE `kweaver`;

CREATE TABLE IF NOT EXISTS `t_studio_user_preference` (
    `user_id` CHAR(36) NOT NULL COMMENT '用户ID（与登录主体一致）',
    `content` LONGTEXT NOT NULL COMMENT 'Studio 用户偏好 JSON，如 pinned 数字员工 ID 列表',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Studio 用户偏好表';
