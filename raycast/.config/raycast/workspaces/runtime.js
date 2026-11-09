/* macOS ships JXA/Foundation/AppKit: no Node, Python or extension runtime required. */
ObjC.import('Foundation');
ObjC.import('AppKit');

function readText(path) {
  var text = $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null);
  if (text.isNil()) throw new Error('Cannot read ' + path);
  return ObjC.unwrap(text);
}
function exists(path) { return Boolean($.NSFileManager.defaultManager.fileExistsAtPath(path)); }
function writeText(path, text) {
  $.NSFileManager.defaultManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError($(path).stringByDeletingLastPathComponent, true, $.NSDictionary.dictionary, null);
  if (!$(text).writeToFileAtomicallyEncodingError(path, true, $.NSUTF8StringEncoding, null)) throw new Error('Cannot write ' + path);
}
function task(executable, args) {
  var process = $.NSTask.alloc.init;
  var pipe = $.NSPipe.pipe;
  process.launchPath = executable;
  process.arguments = args;
  process.standardOutput = pipe;
  process.standardError = pipe;
  process.launch;
  var data = pipe.fileHandleForReading.readDataToEndOfFile;
  process.waitUntilExit;
  var output = ObjC.unwrap($.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding)) || '';
  if (process.terminationStatus !== 0) throw new Error(executable + ' failed: ' + output.trim());
  return output;
}
function screenIds() {
  $.NSApplication.sharedApplication;
  var screens = $.NSScreen.screens, ids = [];
  if (screens.isNil()) return ids;
  for (var i = 0; i < screens.count; i++) ids.push(Number(ObjC.unwrap(screens.objectAtIndex(i).deviceDescription.objectForKey('NSScreenNumber'))));
  return ids;
}
function resolveApp(app) {
  for (var i = 0; i < app.bundleIds.length; i++) {
    var url = $.NSWorkspace.sharedWorkspace.URLForApplicationWithBundleIdentifier(app.bundleIds[i]);
    if (!url.isNil()) return ObjC.unwrap(url.path);
  }
  var roots = ['/Applications/', '/Applications/Setapp/', ObjC.unwrap($.NSHomeDirectory()) + '/Applications/'];
  for (var r = 0; r < roots.length; r++) for (var n = 0; n < app.names.length; n++) {
    var path = roots[r] + app.names[n] + '.app';
    if (exists(path)) {
      var bundle = $.NSBundle.bundleWithPath(path);
      if (!bundle.isNil() && app.bundleIds.indexOf(ObjC.unwrap(bundle.bundleIdentifier)) >= 0) return path;
    }
  }
  return null;
}
function running(bundleIds) {
  return bundleIds.some(function (id) { return $.NSRunningApplication.runningApplicationsWithBundleIdentifier(id).count > 0; });
}
function run(argv) {
  if (argv.length < 2) throw new Error('Usage: runtime.js PACKAGE COMMAND [ARGUMENTS]');
  var dir = argv[0], command = argv[1];
  eval(readText(dir + '/core.js'));
  var catalog = JSON.parse(readText(dir + '/catalog.json'));
  var home = ObjC.unwrap($.NSHomeDirectory());
  var env = $.NSProcessInfo.processInfo.environment;
  var override = env.objectForKey('RAYCAST_WORKSPACES_LOCAL');
  var localPath = override.isNil() ? home + '/Library/Application Support/dotfiles/raycast-workspaces/local.json' : ObjC.unwrap(override);
  if (command === 'init') {
    if (!exists(localPath)) writeText(localPath, JSON.stringify({version:1, profile:'auto', deskScreenIds:[], apps:{}, layouts:{}}, null, 2) + '\n');
    return 'Local settings: ' + localPath;
  }
  var local = exists(localPath) ? JSON.parse(readText(localPath)) : {version:1, profile:'auto', layouts:{}};
  local.layouts = local.layouts || {};
  if (command === 'export-layouts') {
    var indexes = local.displayIndexes || {laptop:0,main:0,support:1};
    var exported = {schemaVersion:1,windowLayouts:[]};
    catalog.variants.forEach(function (v) {
      ['laptop','desk'].forEach(function (p) {
        exported.windowLayouts.push({name:v.title + ' | ' + (p === 'desk' ? 'Desk' : 'Laptop'),iconName:'window-layout',ignoreGap:true,
          layouts:v.layouts[p].map(function (entry, z) {
            var app = catalog.apps[entry.app], ids = local.apps && local.apps[entry.app] ? [local.apps[entry.app]] : app.bundleIds;
            var path = resolveApp({bundleIds:ids,names:app.names});
            // Raycast can discard unknown app sources during import. Do not
            // silently export a partial recipe before required apps are installed.
            if (!path) throw new Error('Install missing app ' + entry.app + ' before exporting native layouts. Run setup-raycast-native.sh apps.');
            return {position:entry.position,size:{height:{relative:entry.heightPercent/100},width:{relative:entry.widthPercent/100}},offset:{},zPosition:z,source:{name:app.names[0],raycastAppId:path},displayIndex:indexes[entry.screen]};
          })});
      });
    });
    var outputPath = argv[2] || localPath.replace(/local\.json$/, 'native-layouts.json');
    writeText(outputPath, JSON.stringify(exported, null, 2) + '\n');
    return 'Import Commands & Layouts: ' + outputPath;
  }
  if (command === 'connect-layouts') {
    // The URL format was copied from a native Raycast 2.8.2 layout, not a private database.
    var prefix = 'raycast://extensions/raycast/window-management/';
    catalog.variants.forEach(function (v) {
      local.layouts[v.id] = local.layouts[v.id] || {};
      ['laptop','desk'].forEach(function (p) {
        var name = v.title + ' | ' + (p === 'desk' ? 'Desk' : 'Laptop');
        local.layouts[v.id][p] = prefix + name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      });
    });
    writeText(localPath, JSON.stringify(local, null, 2) + '\n');
    return 'Connected ' + catalog.variants.length * 2 + ' named layouts. This command must be used only after native import is verified.';
  }
  if (command === 'screens') return JSON.stringify({activeScreenIds:screenIds(), localSettings:localPath});
  if (command === 'link') {
    var variant = catalog.variants.filter(function (v) { return v.id === argv[2]; })[0];
    if (!variant || ['laptop','desk'].indexOf(argv[3]) < 0 || !/^raycast:\/\/[^\s]+$/.test(argv[4] || '')) throw new Error('link VARIANT laptop|desk COPIED_RAYCAST_DEEPLINK');
    local.layouts = local.layouts || {};
    local.layouts[variant.id] = local.layouts[variant.id] || {};
    local.layouts[variant.id][argv[3]] = argv[4];
    writeText(localPath, JSON.stringify(local, null, 2) + '\n');
    return 'Saved ' + variant.title + ' / ' + argv[3];
  }
  if (command === 'profile') {
    if (['auto','laptop','desk'].indexOf(argv[2]) < 0) throw new Error('profile auto|laptop|desk');
    local.profile = argv[2];
    writeText(localPath, JSON.stringify(local, null, 2) + '\n');
    return 'Display profile: ' + local.profile;
  }
  if (command === 'check' || command === 'missing-casks') {
    var missing = [], casks = [], linked = 0;
    Object.keys(catalog.apps).forEach(function (id) {
      var app = catalog.apps[id], ids = local.apps && local.apps[id] ? [local.apps[id]] : app.bundleIds;
      if (!resolveApp({bundleIds:ids,names:app.names})) { missing.push(id); if (app.cask && casks.indexOf(app.cask) < 0) casks.push(app.cask); }
    });
    catalog.variants.forEach(function (v) { ['laptop','desk'].forEach(function (p) { if ((local.layouts[v.id] || {})[p]) linked++; }); });
    if (command === 'missing-casks') return casks.join('\n');
    return JSON.stringify({defaultFocusMinutes:catalog.focus.defaultMinutes,variants:catalog.variants.length,layoutLinks:linked,totalLayoutSlots:catalog.variants.length * 2,missingApps:missing,missingCasks:casks,activeScreenIds:screenIds(),profile:local.profile,localSettings:localPath});
  }
  var request = {action:command === 'plan' ? (argv[3] || 'workspace') : command, id:argv[2], minutes:command === 'plan' ? argv[4] : argv[3], profile:command === 'plan' ? argv[5] : argv[4]};
  var plan = workspacePlan(catalog, local, request, screenIds());
  if (command === 'plan') return JSON.stringify(plan);
  var paths = {}, remoteWasRunning = plan.remote && plan.apps.some(function (app) { return running(app.bundleIds); });
  var platform = {
    remoteWasRunning:remoteWasRunning,
    preflight:function (p) {
      var missing = [];
      p.apps.forEach(function (app) { paths[app.id] = resolveApp(app); if (!paths[app.id]) missing.push(app.id); });
      if (missing.length) throw new Error('Missing apps: ' + missing.join(', ') + '. Run setup-raycast-native.sh apps.');
      if (!p.layoutLink && !remoteWasRunning) throw new Error('Create native layout "' + p.layoutName + '" and save its Copy Deeplink using setup-raycast-native.sh link ' + p.id + ' ' + p.profile + ' URL.');
      if (p.action !== 'layout') {
        if (!exists(catalog.dockflowCLI)) throw new Error('DockFlow CLI is missing.');
        var presets = task(catalog.dockflowCLI, ['list']);
        if (presets.split('\n').some(function (line) { return line.indexOf('- ' + p.dockPreset + ' (ID:') === 0; }) === false) throw new Error('DockFlow preset not found: ' + p.dockPreset);
      }
      if (p.action === 'focus') {
        var session = resolveApp(catalog.session);
        if (!session) throw new Error('Session is missing. Install the focus timer from Session/Setapp, not the unrelated Homebrew session messenger.');
        paths.session = session;
      }
    },
    applyDock:function (name) { task(catalog.dockflowCLI, ['apply','--name',name,'--skip-if-active']); },
    openApps:function (apps) { apps.forEach(function (app) { task('/usr/bin/open', ['-g', paths[app.id]]); }); },
    openLayout:function (url) { task('/usr/bin/open', [url]); },
    openURLs:function (urls) { urls.forEach(function (u) { task('/usr/bin/open', ['-g','-a',paths[u.app],u.url]); }); },
    minimizeApps:function (ids) {
      if (!ids.length) return;
      var se = Application('System Events');
      ids.forEach(function (id) {
        var selectedApp = plan.apps.filter(function (app) { return app.id === id; })[0];
        var bundleId = selectedApp.bundleIds[0], verified = false;
        var stableReads = 0, previousCount = -1;
        for (var attempt = 0; attempt < 20 && !verified; attempt++) {
          var processes = se.applicationProcesses.whose({bundleIdentifier:bundleId})();
          var observed = [];
          if (processes.length) {
            // Electron can expose utility dialogs whose AXMinimized attribute
            // is read-only (for example Notion's tiny startup helper). Only
            // windows that macOS can minimize belong to this readiness check.
            var canMinimize = function (window) {
              return Boolean(window.attributes.byName('AXMinimized').settable());
            };
            var windows = processes[0].windows().filter(canMinimize);
            for (var w = 0; w < windows.length; w++) {
              var minimized = windows[w].attributes.byName('AXMinimized');
              if (!Boolean(minimized.value())) minimized.value = true;
            }
            // Re-enumerate and read back: setting an AX attribute is not proof
            // that every startup window has entered the minimized state.
            observed = processes[0].windows().filter(canMinimize);
          }
          var allMinimized = observed.length > 0 && observed.every(function (window) {
            return Boolean(window.attributes.byName('AXMinimized').value());
          });
          stableReads = allMinimized ? (observed.length === previousCount ? stableReads + 1 : 1) : 0;
          previousCount = observed.length;
          verified = stableReads >= 2;
          if (!verified) delay(0.25);
        }
        if (!verified) throw new Error('Could not verify all ' + selectedApp.names[0] + ' windows minimized. Finish app startup/sign-in and check assistive access, then retry.');
      });
    },
    confirmTimer:function (p) {
      var app = Application.currentApplication(); app.includeStandardAdditions = true;
      try {
        var result = app.displayDialog('Workspace requested: ' + p.title + '\n\nCheck that its windows are ready. Start ' + p.minutes + ' minutes in Session / ' + p.category + '?\n\nAn existing Session timer or reflection prompt may need your attention.', {withTitle:'Start Focus',buttons:['Not Now','Start ' + p.minutes + ' min'],defaultButton:'Start ' + p.minutes + ' min',cancelButton:'Not Now'});
        return result.buttonReturned === 'Start ' + p.minutes + ' min';
      } catch (error) { if (error.errorNumber === -128 || /cancel/i.test(String(error))) return false; throw error; }
    },
    openSession:function (url) { task('/usr/bin/open', ['-a',paths.session,url]); }
  };
  return JSON.stringify(executeWorkspace(plan, platform));
}
