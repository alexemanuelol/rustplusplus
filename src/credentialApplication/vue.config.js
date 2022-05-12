module.exports = {
    pluginOptions: {
        electronBuilder: {
            preload: 'src/preload.js',
            builderOptions: {
                productName: "rustPlusPlus FCM Credential Application",
                appId: 'com.alexemanuelol.electron.rustplusplus.fcmcredentialapp',
                artifactName: 'rustPlusPlus-${version}-${os}-${arch}.${ext}',
                "mac": {
                    "icon": "./public/icon_rounded.png",
                },
                "win": {
                    "icon": "./public/icon_rounded.png",
                },
            },
            externals: [
                'push-receiver',
            ],
        },
    },
}