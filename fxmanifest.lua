fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'Peak Scripts | KostaZ'
description 'Minigames used by our scripts'
version '1.0.0'

server_scripts {
    'server/**/*'
}

client_scripts {
    'client/**/*',
}

shared_scripts {
    '@ox_lib/init.lua',
}

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
	'web/build/**/*',
    'config/*.lua'
}
