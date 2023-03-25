import axios from "axios";
import { load } from "cheerio";
import { format } from "date-fns";
import loggerFactory from "../log";
const logger = loggerFactory(import.meta.url);
import axiosRetry from "axios-retry";

axiosRetry(axios, { retries: 2 });

const hotelNameClassname = "fcab3ed991";
const hotelDivClassname = "d20f4628d0";
const hotelPriceClassname = "fbd1d3018c";
const hotelScoreClassname = "d10a6220b4";
const paginationItemClassname = "f32a99c8d1";

const offsetIncrementer = 30;
const maxPage = 5;

async function getBookingPage(
  offset,
  adults,
  searchDestination,
  startDate,
  endDate,
) {
  const url = `https://www.booking.com/searchresults.en-gb.html?ss=${encodeURIComponent(
    searchDestination,
  )}&checkin=${format(startDate, "yyyy-MM-dd")}&checkout=${format(
    endDate,
    "yyyy-MM-dd",
  )}&group_adults=${adults}&offset=${offset}&selected_currency=USD`;
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/48.0",
    },
    timeout: 30 * 1000,
  });
  logger.info(url);

  if (response.status !== 200) {
    return Promise.reject(response.status);
  }

  return Promise.resolve(load(response.data));
}

async function processHotels(
  offset,
  adults,
  searchDestination,
  startDate,
  endDate,
) {
  const days = (endDate - startDate) / (1000 * 60 * 60 * 24);

  try {
    const cheerioPage = await getBookingPage(
      offset,
      adults,
      searchDestination,
      startDate,
      endDate,
    );
    const hotelElements = cheerioPage(`div.${hotelDivClassname}`);
    const hotels = [];

    hotelElements.each((i, ho) => {
      const name = cheerioPage(ho)
        .find(`div.${hotelNameClassname}`)
        .text()
        .trim();
      const price =
        parseInt(
          cheerioPage(ho)
            .find(`span.${hotelPriceClassname}`)
            .text()
            .trim()
            .substring(3)
            .replace(",", ""),
        ) /
        days /
        adults;
      const scoreElement = cheerioPage(ho).find(`div.${hotelScoreClassname}`);
      const score =
        scoreElement.length > 0 ? parseFloat(scoreElement.text().trim()) : 0;

      if (score >= 6) {
        hotels.push({
          name,
          priceSoloPerPerson: adults === 1 ? price : 0,
          priceMultiplePerPerson: adults > 1 ? price : 0,
          score,
        });
      }
    });
    return Promise.resolve(hotels);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function fetchHotels(adults, searchDestination, startDate, endDate) {
  let offset = 0;

  const cheerioPage = await getBookingPage(
    offset,
    adults,
    searchDestination,
    startDate,
    endDate,
  );
  const paginationItems = cheerioPage(`li.${paginationItemClassname}`);
  const lastPaginationItem = paginationItems.last().text().trim();
  const all_offset = Math.min(
    parseInt(lastPaginationItem.split(/\s+/).pop()),
    maxPage,
  );

  const fetchPagePromises = [];

  for (let i = 0; i < all_offset; i++) {
    fetchPagePromises.push(
      processHotels(offset, adults, searchDestination, startDate, endDate),
    );
    offset += offsetIncrementer;
  }

  try {
    const hotels = await Promise.all(fetchPagePromises);
    return Promise.resolve(hotels.flat());
  } catch (e) {
    return Promise.reject(e);
  }
}

function calculateAverageRangeAccomodationsPrice(pricesList) {
  const sortedPrices = pricesList.sort((a, b) => a - b);
  const n = sortedPrices.length;

  if (n === 0) {
    return [null, null];
  }

  const mean = (lst) => lst.reduce((acc, val) => acc + val, 0) / lst.length;

  const s1 = Math.round(mean(sortedPrices.slice(0, Math.floor(n / 8))));
  const s2 = Math.round(mean(sortedPrices.slice(Math.floor((7 * n) / 8))));

  return [s1, s2];
}

export async function getCityAverageRangeAccomodationsPrice({
  adultsNumber,
  city,
  endDate,
  startDate,
}) {
  try {
    const hotels = await fetchHotels(adultsNumber, city, startDate, endDate);
    return Promise.resolve({
      soloPricePerPersonRange: calculateAverageRangeAccomodationsPrice(
        hotels
          .filter((hotel) => hotel.priceSoloPerPerson > 0)
          .map((hotel) => hotel.priceSoloPerPerson),
      ),
      multiplePricePerPersonRange: calculateAverageRangeAccomodationsPrice(
        hotels
          .filter((hotel) => hotel.priceMultiplePerPerson > 0)
          .map((hotel) => hotel.priceMultiplePerPerson),
      ),
    });
  } catch (e) {
    return Promise.reject(e);
  }
}
