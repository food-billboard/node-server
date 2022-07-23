// 名称
const MOVIE_NAME = async (page) => {
	const name =
		(await page.$eval("#content h1 span", (value) => {
			return value.innerHTML
		})) || ""
	return name.split(" ")[0].trim()
}

const BASE_INFO_WRAPPER = "#content .article .subject"

// 导演
const MOVIE_DIRECTOR = async (page) => {
	const name = await page.$eval(
		`${BASE_INFO_WRAPPER} #info span .attrs a`,
		(value) => {
			return {
				value: value.innerHTML.trim(),
				id: value.href.split("celebrity")[1].replaceAll("/", ""),
			}
		}
	)
	return [name]
}

// 演员
const MOVIE_ACTORS = async (page) => {
	const actors = await page.$$eval(
		`${BASE_INFO_WRAPPER} #info .actor .attrs span`,
		(value) => {
			return value.reduce((acc, item) => {
        try {
          const target = item.querySelector("a")
          acc.push({
            value: target.innerHTML.trim(),
            id: target.href.split("celebrity")[1].replaceAll("/", ""),
          })
        }catch(err) {}
        return acc 
			}, [])
		}
	)
	return actors
}

// 海报
const MOVIE_POSTER = async (page) => {
	const image = await page.$eval(
		`${BASE_INFO_WRAPPER} #mainpic img`,
		(value) => {
			return value.src
		}
	)
	return image
}

// 类型
const MOVIE_CLASSIFY = async (page) => {
	const classify = await page.$$eval(
		`${BASE_INFO_WRAPPER} #info span[property='v:genre']`,
		(value) => {
			return value.map((item) => {
				return item.innerHTML
			})
		}
	)
	return classify
}

// 日期
const MOVIE_DATE = async (page) => {
	const date = await page.$eval(
		`${BASE_INFO_WRAPPER} #info span[property='v:initialReleaseDate']`,
		(value) => {
			return value.innerHTML.slice(0, 10)
		}
	)
	return date
}

// 语言
const MOVIE_LANGUAGE = async (page) => {
	const language = await page.$$eval(
		`${BASE_INFO_WRAPPER} #info .pl`,
		(value) => {
			const target = value.find((item) => {
				return item.innerHTML.startsWith("语言")
			})
			return target.nextSibling.textContent
		}
	)
	return [(language || "").trim()]
}

// 地区
const MOVIE_DISTRICT = async (page) => {
	const district = await page.$$eval(
		`${BASE_INFO_WRAPPER} #info .pl`,
		(value) => {
			const target = value.find((item) => {
				return item.innerHTML.startsWith("制片国家")
			})
			return target.nextSibling.textContent
		}
	)
	return [(district || "").trim()]
}

// 别名
const MOVIE_ALIAS = async (page) => {
	const alias = await page.$$eval(`${BASE_INFO_WRAPPER} #info .pl`, (value) => {
		const target = value.find((item) => {
			return item.innerHTML.startsWith("又名")
		})
		if (!target) return []
		return target.nextSibling.textContent.split("/").map((item) => {
			return item.trim()
		})
	})
	return alias
}

// 评分
const MOVIE_RATE = async (page) => {
	const rate =
		(await page.$eval("#interest_sectl .rating_num", (value) => {
			return parseFloat(value.innerHTML)
		})) || 0
	return rate
}

// 描述
const MOVIE_DESCRIPTION = async (page) => {
	try {
		const allDescription = await page.$eval(
			`.related-info .all.hidden`,
			(value) => {
				return value ? value.innerHTML : ""
			}
		)
		return allDescription.trim()
	} catch (err) {
		const hiddenDescription = await page.$eval(
			`.related-info span[property='v:summary']`,
			(value) => {
				return value.innerHTML
			}
		)
		return hiddenDescription.trim()
	}
}

// 基础信息
const GET_MOVIE_BASE_INFO = async (page) => {
	const name = await MOVIE_NAME(page)
	const director = await MOVIE_DIRECTOR(page)
	const poster = await MOVIE_POSTER(page)
	const actor = await MOVIE_ACTORS(page)
	const classify = await MOVIE_CLASSIFY(page)
	const screen_time = await MOVIE_DATE(page)
	const language = await MOVIE_LANGUAGE(page)
	const district = await MOVIE_DISTRICT(page)
	const alias = await MOVIE_ALIAS(page)
	const rate = await MOVIE_RATE(page)
	const description = await MOVIE_DESCRIPTION(page)
	return {
		name,
		classify,
		actor,
		director,
		language,
		alias,
		screen_time,
		description,
		author_rate: 0,
		author_description: "",
		poster,
		district,
		rate,
	}
}

module.exports = {
	GET_MOVIE_BASE_INFO,
}
