import { isEnvBrowser } from './misc';
import { DebugEvent } from '@/types';

export const debugData = <P>(events: DebugEvent<P>[], timer = 1000): void => {
    if (process.env.NODE_ENV === 'development' && isEnvBrowser()) {
        for (const event of events) {
            setTimeout(() => {
                window.dispatchEvent(
                    new MessageEvent('message', {
                        data: {
                            action: event.action,
                            data: event.data,
                        },
                    })
                );
            }, timer);
        }
    }
};