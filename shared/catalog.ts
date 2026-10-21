// Offline film catalog: real TMDB ids, titles and image paths (resolved from the TMDB API on 2026-10-20).
// Used for the demo seed, the no-key fallback on search/trending, and taste-match recommendations.
// Data and images courtesy of TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.

export type CatalogFilm = {
  tmdbId: number
  title: string
  releaseYear: number | null
  posterPath: string | null
  backdropPath: string | null
  genres: string[]
  voteAverage: number
}

export const CATALOG: CatalogFilm[] = [
  { tmdbId: 27205, title: "Inception", releaseYear: 2010, posterPath: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", backdropPath: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg", genres: ["Action", "Science Fiction", "Crime"], voteAverage: 8.4 },
  { tmdbId: 157336, title: "Interstellar", releaseYear: 2014, posterPath: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", backdropPath: "/8sNiAPPYU14PUepFNeSNGUTiHW.jpg", genres: ["Adventure", "Drama", "Science Fiction"], voteAverage: 8.5 },
  { tmdbId: 155, title: "The Dark Knight", releaseYear: 2008, posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", backdropPath: "/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg", genres: ["Action", "Thriller", "Crime"], voteAverage: 8.5 },
  { tmdbId: 329865, title: "Arrival", releaseYear: 2016, posterPath: "/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg", backdropPath: "/8MUZz7oPXQftFTslZpRP3CVMOoq.jpg", genres: ["Drama", "Science Fiction", "Mystery"], voteAverage: 7.6 },
  { tmdbId: 335984, title: "Blade Runner 2049", releaseYear: 2017, posterPath: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", backdropPath: "/gNdLJU9TxrpGx4dkZidjys3fyy0.jpg", genres: ["Science Fiction", "Drama"], voteAverage: 7.6 },
  { tmdbId: 438631, title: "Dune", releaseYear: 2021, posterPath: "/v1tRXZ4JtD2Iv6fjkPvT4GiwslV.jpg", backdropPath: "/qVgZu5BTx6pu4owCvVOm4zjTfOi.jpg", genres: ["Science Fiction", "Adventure"], voteAverage: 7.8 },
  { tmdbId: 693134, title: "Dune: Part Two", releaseYear: 2024, posterPath: "/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg", backdropPath: "/eZ239CUp1d6OryZEBPnO2n87gMG.jpg", genres: ["Science Fiction", "Adventure"], voteAverage: 8.1 },
  { tmdbId: 603, title: "The Matrix", releaseYear: 1999, posterPath: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", backdropPath: "/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg", genres: ["Action", "Science Fiction"], voteAverage: 8.3 },
  { tmdbId: 496243, title: "Parasite", releaseYear: 2019, posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", backdropPath: "/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg", genres: ["Comedy", "Thriller", "Drama"], voteAverage: 8.5 },
  { tmdbId: 545611, title: "Everything Everywhere All at Once", releaseYear: 2022, posterPath: "/u68AjlvlutfEIcpmbYpKcdi09ut.jpg", backdropPath: "/fIwiFha3WPu5nHkBeMQ4GzEk0Hv.jpg", genres: ["Action", "Adventure", "Science Fiction"], voteAverage: 7.7 },
  { tmdbId: 872585, title: "Oppenheimer", releaseYear: 2023, posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", backdropPath: "/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg", genres: ["Drama", "History", "War"], voteAverage: 8 },
  { tmdbId: 569094, title: "Spider-Man: Across the Spider-Verse", releaseYear: 2023, posterPath: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", backdropPath: "/kVd3a9YeLGkoeR50jGEXM6EqseS.jpg", genres: ["Animation", "Action", "Adventure", "Science Fiction"], voteAverage: 8.4 },
  { tmdbId: 324857, title: "Spider-Man: Into the Spider-Verse", releaseYear: 2018, posterPath: "/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg", backdropPath: "/1ntePsIqeklfmrQJqZPncCydsqY.jpg", genres: ["Animation", "Action", "Adventure", "Science Fiction"], voteAverage: 8.4 },
  { tmdbId: 129, title: "Spirited Away", releaseYear: 2001, posterPath: "/jUo8cNmU400WtZiJss45HNXlQ2e.jpg", backdropPath: "/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg", genres: ["Animation", "Family", "Fantasy"], voteAverage: 8.5 },
  { tmdbId: 76341, title: "Mad Max: Fury Road", releaseYear: 2015, posterPath: "/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg", backdropPath: "/gqrnQA6Xppdl8vIb2eJc58VC1tW.jpg", genres: ["Action", "Adventure", "Science Fiction"], voteAverage: 7.6 },
  { tmdbId: 680, title: "Pulp Fiction", releaseYear: 1994, posterPath: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg", backdropPath: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg", genres: ["Thriller", "Crime", "Comedy"], voteAverage: 8.5 },
  { tmdbId: 550, title: "Fight Club", releaseYear: 1999, posterPath: "/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg", backdropPath: "/c6OLXfKAk5BKeR6broC8pYiCquX.jpg", genres: ["Drama", "Thriller"], voteAverage: 8.4 },
  { tmdbId: 278, title: "The Shawshank Redemption", releaseYear: 1994, posterPath: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg", backdropPath: "/pNjh59JSxChQktamG3LMp9ZoQzp.jpg", genres: ["Drama", "Crime"], voteAverage: 8.7 },
  { tmdbId: 238, title: "The Godfather", releaseYear: 1972, posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", backdropPath: "/ejdD20cdHNFAYAN2DlqPToXKyzx.jpg", genres: ["Drama", "Crime"], voteAverage: 8.7 },
  { tmdbId: 120, title: "The Lord of the Rings: The Fellowship of the Ring", releaseYear: 2001, posterPath: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", backdropPath: "/oiwc338EoBgS4sEI2ixAny4KQKg.jpg", genres: ["Adventure", "Fantasy", "Action"], voteAverage: 8.4 },
  { tmdbId: 244786, title: "Whiplash", releaseYear: 2014, posterPath: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", backdropPath: "/fRGxZuo7jJUWQsVg9PREb98Aclp.jpg", genres: ["Drama", "Music", "Thriller"], voteAverage: 8.4 },
  { tmdbId: 313369, title: "La La Land", releaseYear: 2016, posterPath: "/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg", backdropPath: "/nlPCdZlHtRNcF6C9hzUH4ebmV1w.jpg", genres: ["Comedy", "Drama", "Romance"], voteAverage: 7.9 },
  { tmdbId: 419430, title: "Get Out", releaseYear: 2017, posterPath: "/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg", backdropPath: "/bBQHALHRAaaORlPNXv7fNcRXYdx.jpg", genres: ["Mystery", "Thriller", "Horror"], voteAverage: 7.6 },
  { tmdbId: 530915, title: "1917", releaseYear: 2019, posterPath: "/iZf0KyrE25z1sage4SYFLCCrMi9.jpg", backdropPath: "/2lBOQK06tltt8SQaswgb8d657Mv.jpg", genres: ["War", "Drama", "History"], voteAverage: 8 },
  { tmdbId: 346698, title: "Barbie", releaseYear: 2023, posterPath: "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", backdropPath: "/1esAE8sLJRWWFsLLeh5r3g2WanI.jpg", genres: ["Comedy", "Adventure", "Fantasy"], voteAverage: 6.9 },
  { tmdbId: 940721, title: "Godzilla Minus One", releaseYear: 2023, posterPath: "/2E2WTX0TJEflAged6kzErwqX1kt.jpg", backdropPath: "/oHBhHoNe59VH6bUMazDtJmWOFSS.jpg", genres: ["Science Fiction", "Horror", "Action"], voteAverage: 7.6 },
  { tmdbId: 792307, title: "Poor Things", releaseYear: 2023, posterPath: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg", backdropPath: "/zh6IdheEYinU4TPtorWsjx6qPQE.jpg", genres: ["Science Fiction", "Romance", "Comedy"], voteAverage: 7.6 },
  { tmdbId: 315162, title: "Puss in Boots: The Last Wish", releaseYear: 2022, posterPath: "/kuf6dutpsT0vSVehic3EZIqkOBt.jpg", backdropPath: "/jr8tSoJGj33XLgFBy6lmZhpGQNu.jpg", genres: ["Animation", "Adventure", "Fantasy", "Comedy", "Family"], voteAverage: 8.2 },
  { tmdbId: 361743, title: "Top Gun: Maverick", releaseYear: 2022, posterPath: "/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg", backdropPath: "/AaV1YIdWKnjAIAOe8UUKBFm327v.jpg", genres: ["Action", "Drama"], voteAverage: 8.2 },
  { tmdbId: 263115, title: "Logan", releaseYear: 2017, posterPath: "/fnbjcRDYn6YviCcePDnGdyAkYsB.jpg", backdropPath: "/4DZxWNSAyksN6N3JkvpJ53Yq6zU.jpg", genres: ["Action", "Drama", "Science Fiction"], voteAverage: 7.8 },
  { tmdbId: 62, title: "2001: A Space Odyssey", releaseYear: 1968, posterPath: "/ve72VxNqjGM69Uky4WTo2bK6rfq.jpg", backdropPath: "/w5IDXtifKntw0ajv2co7jFlTQDM.jpg", genres: ["Science Fiction", "Mystery", "Adventure"], voteAverage: 8 },
  { tmdbId: 78, title: "Blade Runner", releaseYear: 1982, posterPath: "/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg", backdropPath: "/2spEHYDcyE9r9mS7AFEscfKVDzO.jpg", genres: ["Science Fiction", "Drama", "Thriller"], voteAverage: 7.9 },
  { tmdbId: 4935, title: "Howl's Moving Castle", releaseYear: 2004, posterPath: "/13kOl2v0nD2OLbVSHnHk8GUFEhO.jpg", backdropPath: "/nv5wwZou159v5OC61i4ElR7OqyY.jpg", genres: ["Fantasy", "Animation", "Adventure"], voteAverage: 8.4 },
  { tmdbId: 194, title: "Amélie", releaseYear: 2001, posterPath: "/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg", backdropPath: "/6n53UI4mX9QMfe2S0Pgt8mGebY1.jpg", genres: ["Comedy", "Romance"], voteAverage: 7.9 },
  { tmdbId: 14160, title: "Up", releaseYear: 2009, posterPath: "/mFvoEwSfLqbcWwFsDjQebn9bzFe.jpg", backdropPath: "/hGGC9gKo7CFE3fW07RA587e5kol.jpg", genres: ["Animation", "Comedy", "Family", "Adventure"], voteAverage: 8 },
  { tmdbId: 105, title: "Back to the Future", releaseYear: 1985, posterPath: "/vN5B5WgYscRGcQpVhHl6p9DDTP0.jpg", backdropPath: "/5bzPWQ2dFUl2aZKkp7ILJVVkRed.jpg", genres: ["Adventure", "Comedy", "Science Fiction"], voteAverage: 8.3 },
  { tmdbId: 1022789, title: "Inside Out 2", releaseYear: 2024, posterPath: "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg", backdropPath: "/p5ozvmdgsmbWe0H8Xk7Rc8SCwAB.jpg", genres: ["Animation", "Adventure", "Comedy", "Family"], voteAverage: 7.5 },
  { tmdbId: 466420, title: "Killers of the Flower Moon", releaseYear: 2023, posterPath: "/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg", backdropPath: "/jwjCWMPWSQ7h3sqG4mqI7pMEZu0.jpg", genres: ["Crime", "History", "Drama"], voteAverage: 7.4 },
  { tmdbId: 4977, title: "Paprika", releaseYear: 2006, posterPath: "/nHJljo2Pi7XimYEgV9hvRchQWmg.jpg", backdropPath: "/3fgcEjBNrhstYgPlG1c8WT7UpIN.jpg", genres: ["Animation", "Science Fiction", "Thriller"], voteAverage: 7.8 },
  { tmdbId: 37165, title: "The Truman Show", releaseYear: 1998, posterPath: "/vuza0WqY239yBXOadKlGwJsZJFE.jpg", backdropPath: "/rmiG2uwcNoGFmBKMoa1pIcf514L.jpg", genres: ["Comedy", "Drama"], voteAverage: 8.2 },
]

export const CATALOG_BY_ID: Map<number, CatalogFilm> = new Map(CATALOG.map((f) => [f.tmdbId, f]))
