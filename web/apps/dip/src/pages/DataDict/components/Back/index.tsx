import { ArrowLeftOutlined } from '@ant-design/icons';
import styles from './index.module.less';

const Back = ({
  title,
  onClick
}: {
  title: string | JSX.Element;
  onClick: () => void;
}): JSX.Element => {
  return (
    <div className={styles.container}>
      <div className={styles['back-component']}>
        <div
          className={`${styles.back} ${styles['back-content']}`}
          onClick={(): void => onClick?.()}
        >
          <ArrowLeftOutlined className={styles.anticon} />
          <span className={styles['main-title']}>{title}</span>
        </div>
      </div>
    </div>
  );
};

export default Back;
