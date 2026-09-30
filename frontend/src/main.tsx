import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './features/draw.css';
import './celestial.css';

createRoot(document.getElementById('root')!).render(<App/>);
if(import.meta.env.PROD && 'serviceWorker' in navigator){
  window.addEventListener('load',()=>void navigator.serviceWorker.register('/sw.js').then(registration=>{
    const notify=()=>{if(registration.waiting)window.dispatchEvent(new CustomEvent('tarot-update-ready',{detail:registration.waiting}));};
    notify();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',notify));
  }).catch(()=>{}));
}
