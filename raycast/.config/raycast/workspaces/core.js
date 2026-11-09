/* Pure planning and sequencing shared by macOS JXA and the Node test harness. */
function workspacePlan(catalog, local, request, screenIds) {
  var variant = catalog.variants.filter(function (v) { return v.id === request.id; })[0];
  if (!variant) throw new Error('Unknown workspace: ' + request.id);
  if (['layout', 'workspace', 'focus'].indexOf(request.action) < 0) throw new Error('Unknown action.');
  var minutes = request.minutes === undefined || request.minutes === '' ? catalog.focus.defaultMinutes : Number(request.minutes);
  if (catalog.focus.allowedMinutes.indexOf(minutes) < 0) throw new Error('Duration must be 25, 30 or 45 minutes.');
  var profile = request.profile || 'auto';
  if (profile === 'auto') profile = local.profile || 'auto';
  if (profile === 'auto') {
    if (screenIds.length === 1) profile = 'laptop';
    else if (screenIds.length === 2) profile = 'desk';
    else if ((local.deskScreenIds || []).length === 2 && local.deskScreenIds.every(function (id) { return screenIds.indexOf(id) >= 0; })) profile = 'desk';
    else throw new Error('Choose Laptop or Desk explicitly for this display arrangement.');
  }
  if (['laptop', 'desk'].indexOf(profile) < 0) throw new Error('Display must be Auto, Laptop or Desk.');
  if (profile === 'desk' && screenIds.length < 2) throw new Error('Desk needs two active displays. Select Laptop.');
  if (profile === 'laptop' && screenIds.length !== 1) throw new Error('Laptop layouts require one active display. Disconnect external displays or select Desk.');
  var overrides = local.apps || {};
  var apps = variant.apps.map(function (id) {
    if (!catalog.apps[id]) throw new Error('Unknown app: ' + id);
    return {id:id, bundleIds:overrides[id] ? [overrides[id]] : catalog.apps[id].bundleIds, names:catalog.apps[id].names};
  });
  var link = ((local.layouts || {})[variant.id] || {})[profile] || '';
  if (link && !/^raycast:\/\/[^\s]+$/.test(link)) throw new Error('Layout link must be a Raycast deeplink.');
  return {
    action:request.action, id:variant.id, title:variant.title, profile:profile,
    minutes:minutes, category:variant.category, dockPreset:variant.dockPreset,
    layoutName:variant.title + ' | ' + (profile === 'desk' ? 'Desk' : 'Laptop'),
    layoutLink:link, apps:apps, minimize:variant.minimize || [], urls:variant.urls || [],
    remote:variant.workflow === 'remote', geometry:variant.layouts[profile],
    sessionURL:'session:///start?duration=' + minutes + '&categoryName=' + encodeURIComponent(variant.category) + '&intent=' + encodeURIComponent(variant.title)
  };
}

function executeWorkspace(plan, platform) {
  /* Complete checks before the first app/Dock change. No timer/quit on failure. */
  platform.preflight(plan);
  if (plan.action !== 'layout') platform.applyDock(plan.dockPreset);
  platform.openApps(plan.apps);
  var remoteAlreadyOpen = plan.remote && platform.remoteWasRunning;
  if (!remoteAlreadyOpen) platform.openLayout(plan.layoutLink);
  platform.openURLs(plan.urls);
  platform.minimizeApps(plan.minimize);
  if (plan.action === 'focus') {
    /* Deeplink dispatch has no completion acknowledgement. The user confirms readiness. */
    if (!platform.confirmTimer(plan)) return {status:'workspace_prepared_timer_cancelled', timerRequested:false};
    // Startup or a user action during readiness can reveal another reference window.
    // Re-check all minimized companions immediately before requesting the timer.
    platform.minimizeApps(plan.minimize);
    platform.openSession(plan.sessionURL);
    return {status:'timer_requested_check_session', timerRequested:true};
  }
  return {status:remoteAlreadyOpen ? 'remote_clients_opened_layout_preserved' : 'layout_requested', timerRequested:false};
}

if (typeof module !== 'undefined') module.exports = {workspacePlan:workspacePlan, executeWorkspace:executeWorkspace};
