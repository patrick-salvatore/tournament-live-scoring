import { keyframes } from 'goober';
import type { ToastType } from '../types';

export type ProgressBarProps = {
  duration: number;
  isRunning: boolean;
  type: ToastType;
  hide?: boolean;
};

export function ProgressBar(props: ProgressBarProps) {
  return (
    <div
      style={`
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 5px;
        z-index: 9999;
        opacity: 0.7;
        transform-origin: left;
        background: #ffffffb3;
        animation: ${keyframes`0%{transform:scaleX(1);}100%{transform:scaleX(0);}`} linear 1 forwards;
        animation-duration:${props.duration}ms;
        animation-play-state:${props.isRunning ? 'running' : 'paused'};
        opacity:${props.hide ? 0 : 1};
      `}
      role="progressbar"
      aria-hidden={props.hide ? 'true' : 'false'}
      aria-label="notification timer"
    />
  );
}
