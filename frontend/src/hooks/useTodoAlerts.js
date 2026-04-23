import { useEffect } from 'react';

/**
 * Checks todos with alerts enabled and fires browser notifications
 * when conditions are met. Runs on mount and every 30 minutes.
 */
export function useTodoAlerts(todos) {
  useEffect(() => {
    if (!todos || todos.length === 0) return;

    const triggerAlerts = async () => {
      // Request permission if not yet granted
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      todos.forEach(todo => {
        if (!todo.alert_enabled || todo.status === 'done') return;

        const alertTime = todo.alert_time || '09:00';
        // Only fire if current time matches alert time (within the same minute)
        if (currentTime !== alertTime) return;

        let shouldAlert = false;
        let message = '';

        if (todo.alert_type === 'daily') {
          shouldAlert = true;
          message = todo.end_date
            ? `Due: ${todo.end_date}`
            : 'Ongoing task';
        } else if (todo.alert_type === 'days_before' && todo.end_date) {
          const daysUntil = Math.ceil(
            (new Date(todo.end_date) - new Date(todayStr)) / (1000 * 60 * 60 * 24)
          );
          const threshold = parseInt(todo.alert_days_before) || 1;
          if (daysUntil <= threshold && daysUntil >= 0) {
            shouldAlert = true;
            message = daysUntil === 0
              ? '⚠️ Due TODAY!'
              : `⏰ Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
          }
        }

        if (shouldAlert) {
          const tag = `todo-alert-${todo.id}-${todayStr}`;
          new Notification(`📋 ${todo.title}`, {
            body: `${message}${todo.company_name ? ` · ${todo.company_name}` : ''}`,
            icon: '/favicon.ico',
            tag, // prevents duplicate notifications
          });
        }
      });
    };

    triggerAlerts();
    // Re-run every 60 seconds to catch the exact alert minute
    const interval = setInterval(triggerAlerts, 60 * 1000);
    return () => clearInterval(interval);
  }, [todos]);
}
