require('dotenv').config();

const fetch = require('node-fetch');

const { APP_TOKEN, LAT, LNG } = process.env;
if (!APP_TOKEN) {
    console.error('No APP_TOKEN specified in .env');
    return;
}

if (!LAT || !LNG) {
    console.error('No LAT or LNG specified in .env');
    return;
}

const { argv } = process;
if (argv.length < 3) {
    console.error('not enough parameters provided.');
    return;
}

if (argv.length > 3) {
    console.error('Contain search phrase in quotes.');
    return;
}

const searchPhrase = argv[2];
const RESTAURANT_URL = `https://api.skipthedishes.com/customer/v1/restaurants/search/web?language=en&lat=${LAT}&long=${LNG}&order_type=DELIVERY`;
const MENU_URL = `https://api-skipthedishes.skipthedishes.com/v1/restaurants/clean-url/:cleanUrl?fullMenu=true&language=en&lat=${LAT}&long=${LNG}&order_type=DELIVERY`

console.info(`Searching for [${searchPhrase}]...`);

fetch(RESTAURANT_URL, {
    headers: {
        'App-Token': APP_TOKEN,
    },
}).then((response) => {
    return response.json();
}).then((parsedResponse) => {
    const { restaurants } = parsedResponse;
    restaurants.forEach((restaurant) => {
        const { name: restaurantName, cleanUrl } = restaurant;
        fetch(MENU_URL.replace(':cleanUrl', cleanUrl), {
            headers: {
                'App-Token': APP_TOKEN,
            },
        }).then((menuResponse) => {
            return menuResponse.json();
        }).then((parsedMenuResponse) => {
            const { menu: { menuGroups } } = parsedMenuResponse;
            menuGroups.forEach((menuGroup) => {
                if (menuGroup.menuItems.length > 0) {
                    menuGroup.menuItems.forEach((menuItem) => {
                        const { name, description } = menuItem;

                        if (name.indexOf(searchPhrase) > -1 || description.indexOf(searchPhrase) > -1) {
                            console.log(`Matching item from ${restaurantName}`);
                            console.log(`    Menu Item: ${name}`);
                            console.log(`    Description: ${description}\n`);
                        }
                    });
                }
            });
        }).catch((menuError) => {
           console.log('Menu error:', menuError);
        });
    });
}).catch((err) => {
    console.error('Error: ', err);
});
