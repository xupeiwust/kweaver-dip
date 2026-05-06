USE kweaver;

CREATE TABLE IF NOT EXISTS t_studio_user_preference (
    user_id CHAR(36) NOT NULL COMMENT '用户ID（与登录主体一致）',
    content TEXT NOT NULL COMMENT 'Studio 用户偏好 JSON，如 pinned 数字员工 ID 列表',
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
    CLUSTER PRIMARY KEY (user_id)
);

COMMENT ON TABLE t_studio_user_preference IS 'Studio 用户偏好表';
