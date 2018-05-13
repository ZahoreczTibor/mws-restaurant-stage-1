/**
 * Common database helper functions.
 */
const idbKey = require('./indexedb');

const DBHelper = {

  DATABASE_URL: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'data/restaurants.json' : 'http://localhost:1337/restaurants';
  },

  /**
   * Fetch all restaurants.
   */
  fetchRestaurants: () => {
    const store = 'restaurants';
    return idbKey.getAll(store)
      .then(restaurants => {
        if (restaurants.length < 10) {
          return fetch(DBHelper.DATABASE_URL())
            .then(response => response.json())
            .then(restaurants => {
              console.log('- Restaurants data fetched !');
              return restaurants.restaurants || restaurants;
            })
            .then(restaurants => {
              restaurants.forEach(restaurant => idbKey.set(store, restaurant));
              return restaurants;
            })
            .catch(error => console.error(`Request failed. Returned status of ${error}`));
        } else {
          return restaurants;
        }
      }).catch(error => {
        console.error(error)
      });
  },

  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById: (id) => {
    // fetch all restaurants with proper error handling.
    const store = 'restaurants';
    return idbKey.get(store, Number(id))
      .then((restaurant) => {
        if (!restaurant) {
          console.log('- No cache found');
          return fetch(DBHelper.DATABASE_URL())
            .then(response => response.json())
            .then(data => {
              const restaurant = data[id - 1];
              idbKey.set(store, restaurant);
              return restaurant;
            })
            .catch(error => console.error(`Restaurant does not exist: ${error}`));
        } else {
          return restaurant;
        }
      })
  },

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  fetchRestaurantByCuisine: (cuisine) => {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants()
      .then(restaurants => restaurants.restaurants.filter(r => r.cuisine_type == cuisine))
      .catch(error => console.error(error));
  },

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  fetchRestaurantByNeighborhood: (neighborhood) => {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => restaurants.restaurants.filter(r => r.neighborhood == neighborhood))
      .catch(error => console.error(error));
  },

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood: (cuisine, neighborhood) => {
    // Fetch all restaurants
    const store = 'restaurants';
    return idbKey.getAll(store)
      .then((cachedResults) => {
        if (cachedResults.length < 10) {
          return DBHelper.fetchRestaurants()
            .then(restaurants => {
              const results = restaurants;
              results.forEach((restaurant) => idbKey.set(store, restaurant));
              return DBHelper.filterResults(results, cuisine, neighborhood);
            })
            .catch(error => console.error(error));
        } else {
          return DBHelper.filterResults(cachedResults, cuisine, neighborhood);
        }
      }).catch((error) => console.error(error));
  },

  filterResults: (results, cuisine, neighborhood) => {
    if (cuisine !== 'all') {
      results = results.filter(restaurant => restaurant.cuisine_type == cuisine);
    }
    if (neighborhood !== 'all') {
      results = results.filter(restaurant => restaurant.neighborhood == neighborhood);
    }
    return results;
  },

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  fetchNeighborhoods: () => {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(restaurant => restaurant.neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        return uniqueNeighborhoods;
      })
      .catch(error => console.error(error));
  },

  /**
   * Fetch all cuisines with proper error handling.
   */
  fetchCuisines: () => {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map(restaurant => restaurant.cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        return uniqueCuisines;
      }).catch(error => console.error(error));
  },
  
/**
   * Restaurant page URL.
   */
  urlForRestaurant: (restaurant) => {
    return (`restaurant.html?id=${restaurant.id}`);
  },

  /**
   * Restaurant image URL.
   */
  imageUrlForRestaurant: (restaurant) => {
    return (`assets/img/jpg/${restaurant.photograph}`);
  },
  
  imageWebpUrlForRestaurant: (restaurant) => {
    return (`assets/img/webp/${restaurant.photograph}`);
  },

  /**q
   * Map marker for a restaurant.
   */
  mapMarkerForRestaurant: (restaurant, map) => {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
};

module.exports = DBHelper;
