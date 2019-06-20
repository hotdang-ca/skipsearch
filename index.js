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
const HEADERS = {
    'App-Token': APP_TOKEN,
    'User-Agent': 'skipsearch (github.com)',
};

console.info(`Searching for [${searchPhrase}]...\n`);

fetch(RESTAURANT_URL, {
    headers: {
        ...HEADERS,
    },
}).then((response) => {
    return response.json();
}).then((parsedResponse) => {
    const { restaurants } = parsedResponse;
    restaurants.forEach((restaurant) => {
        const { name: restaurantName, cleanUrl } = restaurant;
        fetch(MENU_URL.replace(':cleanUrl', cleanUrl), {
            headers: {
                ...HEADERS,
            },
        }).then((menuResponse) => {
            return menuResponse.json();
        }).then((parsedMenuResponse) => {
            const { menu: { menuGroups } } = parsedMenuResponse;
            menuGroups.forEach((menuGroup) => {
                if (menuGroup.menuItems.length > 0) {
                    menuGroup.menuItems.forEach((menuItem) => {
                        const { name, description, centsPrice, available } = menuItem;

                        if (name.indexOf(searchPhrase) > -1 || description.indexOf(searchPhrase) > -1) {
                            if (available) {
                                console.log(`Matching item from ${restaurantName} (https://www.skipthedishes.com/${cleanUrl})`);
                                console.log(`    Menu Item: ${name}`);
                                console.log(`    Price: $${centsPrice / 100}`);
                                console.log(`    Description: ${description}\n`);
                            } else {
                                console.log(menuItem);
                            }
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
