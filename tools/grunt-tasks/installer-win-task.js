/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var cp = require('child_process');
var os = require('os');

module.exports = function(grunt) {
    grunt.registerTask('installer-win', 'Creates setup package for the Windows platform.', function() {
        if (os.platform() === 'win32') {
            var cfg = grunt.config.get('installer-win');
            var wixRoot = 'tools\\installer-win\\';
            var ieAddonRoot = 'browser-extensions\\ie\\bin\\Release';
            var arch = cfg.arch === 'x64' ? 'x64' : 'x86';
            var version = cfg.version;
            // since MSI doesn't support semantic versioning and only supports
            // major.minor.build version types, we convert any RC to the format it can handle
            // using an approach similar to https://github.com/semver/semver/issues/332
            //
            // X.Y.Z-rcN
            // 1.8.0-rc1   1.8.10001
            // 1.8.0-rc2   1.8.10002
            // 1.8.0-rc3   1.8.10003
            // 1.8.0       1.8.30000 (here N is 0)
            // 1.8.1-rc1   1.8.10101
            // 1.8.1-rc2   1.8.10102
            // 1.8.1       1.8.30100 (here N is 0)
            // 1.8.6       1.8.30600 (here N is 0)
            //
            // for N > 0: msi_build = 10000 + Z * 100 + N
            // for N = 0: msi_build = 30000 + Z * 100
            // (where Z < 300 and N < 100)
            var x, y, z, n;
            if (version.indexOf('-rc') > 0) {
                var tokens = version.replace('-rc', '').split('.');
                x = tokens[0];
                y = tokens[1];
                z = tokens[2];
                n = tokens[3];
                if (z >= 300 || n >= 100) {
                    grunt.fail.fatal('Invalid version specified: ' + version);
                }
                version = x + '.' + y + '.' + (10000 + parseInt(z) * 100 + parseInt(n));
            } else if (version.indexOf('-') > 0) {
                grunt.fail.fatal('Invalid version specified: ' + version);
            } else {
                var tokens = version.split('.');
                x = tokens[0];
                y = tokens[1];
                z = tokens[2];
                version = x + '.' + y + '.' + (30000 + parseInt(z) * 100);
            }
            
            cp.execFileSync('heat', 
                            [ 'file', ieAddonRoot + '\\IEAddon.dll',
                              '-srd',
                              '-gg',
                              '-cg', 'IEAddonDLL',
                              '-out', wixRoot + 'ie_addon.wxs'],
                            { stdio : 'inherit'});
                                        
            cp.execFileSync('heat', 
                            [ 'dir', 'dist\\temp',
                              '-o', wixRoot + 'files.wxs',
                              '-scom',
                              '-frag',
                              '-srd',
                              '-sreg',
                              '-gg',
                              '-cg', 'ApplicationFiles',
                              '-dr', 'INSTALLFOLDER',
                              '-t', wixRoot + 'files.xslt'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('candle', 
                            [ '-arch', arch,
                              '-dVersion=' + version,
                              '-ext', 'WixFirewallExtension',
                              '-o', wixRoot + 'config.wixobj',
                              wixRoot + 'config.wxs'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('candle', 
                            [ '-arch', arch,
                              '-ext', 'WixFirewallExtension',
                              '-o', wixRoot + 'files.wixobj',
                              wixRoot + 'files.wxs'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('candle', 
                            [ '-arch', 'x86',
                              '-ext', 'WixFirewallExtension',
                              '-o', wixRoot + 'ie_addon.wixobj',
                              wixRoot + 'ie_addon.wxs'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('light', 
                            [ '-ext', 'WixNetFxExtension',
                              '-ext', 'WixUIExtension',
                              '-ext', 'WixFirewallExtension',
                              '-ext', 'WixUtilExtension',
                              '-spdb',
                              '-sice:ICE60',
                              '-b', 'dist\\temp',
                              '-b', ieAddonRoot,
                              '-o', 'dist\\oxygen-' + cfg.version + '-win-' + cfg.arch + '.msi',
                              wixRoot + 'config.wixobj',
                              wixRoot + 'files.wixobj',
                              wixRoot + 'ie_addon.wixobj'],
                            { stdio : 'inherit'});
        }
    });
};
