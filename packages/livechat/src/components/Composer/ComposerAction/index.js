import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

export const ComposerAction = memo(({ text, onClick, className, style = {}, children }) => (
	<button
		type='button'
		aria-label={text}
		onClick={onClick}
		className={createClassName(styles, 'composer__action', {}, [className])}
		style={style}
	>
		{children}
	</button>
));
