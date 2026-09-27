// Owner navigation for the Academy project page (shared with Overview/Library).
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { navHtml } from './academy-admin-shared.js';

const host = document.getElementById('aa-nav-host');
if (host) host.innerHTML = navHtml('projects');
