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
const search = searchPhrase;

const RESTAURANT_URL = `https://api.skipthedishes.com/customer/v1/graphql?operationName=QueryRestaurantsList&variables=%7B%22latitude%22%3A${LAT}%2C%22longitude%22%3A${LNG}%2C%22isDelivery%22%3Atrue%2C%22search%22%3A%22%22%2C%22dateTime%22%3A0%2C%22language%22%3A%22en%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%229ec5f77aba912fb31aba9fa3a4092ebad2bed55ffe36404787f0e368e4a140f7%22%7D%7D`;
const MENU_URL = `https://api-skipthedishes.skipthedishes.com/v1/restaurants/clean-url/:cleanUrl?fullMenu=true&language=en&lat=${LAT}&long=${LNG}&order_type=DELIVERY`
const HEADERS = {
    'App-Token': APP_TOKEN,
    'User-Agent': 'skipsearch (github.com)',
};

console.info(`Searching for [${searchPhrase}]...\n`);
const results = [];

const doProcessing = async () => {
    const restaurantResponse = await fetch(RESTAURANT_URL, {
        headers: {
            ...HEADERS,
        },
    });

    const parsedResponse = await restaurantResponse.json();
    const { data: { restaurantsList: { openRestaurants }} } = parsedResponse;

    if (openRestaurants.length === 0) {
        console.log('No restaurants');
        // res.status(404).json({ status: `no restaurants with params search: [${search}], lat: [${lat}], lng: [${lng}]`});
        // res.end();
    } else {
        console.log(`fetched ${openRestaurants.length} restaurants.`);
    }

    // for each restaurant, get the menu items
    for (let restaurant of openRestaurants) {
        const { name: restaurantName, cleanUrl } = restaurant;

        console.log(`getting ${cleanUrl}`);

        const menuResponse = await fetch(MENU_URL.replace(':cleanUrl', cleanUrl), {
            headers: {
                ...HEADERS,
            }
        });
        const parsedMenuResponse = await menuResponse.json();

        const { menu: { menuGroups } } = parsedMenuResponse;
        for (let menuGroup of menuGroups) {
            if (menuGroup.menuItems.length > 0) {
                for (let menuItem of menuGroup.menuItems) {
                    const { name, description, centsPrice, available } = menuItem;

                    if (name.indexOf(search) > -1 || description.indexOf(search) > -1) {
                        if (available) {
                        results.push({
                            restaurantName,
                            url: `https://www.skipthedishes.com/${cleanUrl}`,
                            name,
                            price: centsPrice / 100,
                            description,
                        });
                        }
                    }
                }
            }
        }
    }


    console.log(results);
};

doProcessing();
console.log('end of function');
//   res.status(200).json(results);
//   res.end();
