const MOCK_SCREEN_DATA = {
	_id: "62f1d071cb7c2d2b23844998",
	name: "灌篮高手22222",
	poster:
		"http://47.97.27.23/static/image/f6543dfd1e15f8e0ae4e5e1d4e7c975e.jpeg",
	description: "",
	components: {
		name: "灌篮高手22222",
		description: "",
		components: [
			{
				id: "AE3Y86gUv2zymnaZLH6vQ",
				description: "组-1660014900692",
				name: "组-1660014900692",
				type: "GROUP_COMPONENT",
				componentType: "GROUP_COMPONENT",
				config: {
					style: {
						width: 978,
						height: 506,
						left: 406,
						top: 166,
						opacity: 1,
						rotate: 0,
						zIndex: 2,
						skew: { x: 0, y: 0 },
					},
					attr: { visible: true, lock: false },
					options: {
						condition: {
							value: [
								{
									id: "zL5Duue-X3pMRZHZ44pVu",
									action: "hidden",
									type: "condition",
									value: {
										code: {
											relation: [],
											code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
										},
										condition: {
											id: "YWOlO1HwEWIAhVMD05yWw",
											type: "and",
											rule: [
												{
													id: "YpcN-fAi3PqIc6jlKazFU",
													type: "and",
													rule: [
														{
															id: "nO1aW1b-PRQUT8gtREaPu",
															params: "",
															condition: "equal",
															value: "",
														},
													],
												},
											],
										},
									},
								},
							],
							initialState: "visible",
						},
					},
				},
				components: [
					{
						description: "",
						type: "COMPONENT",
						config: {
							style: {
								width: 400,
								height: 400,
								left: 0,
								top: 0,
								opacity: 1,
								rotate: 0,
								zIndex: 2,
								skew: { x: 0, y: 0 },
							},
							attr: { visible: true, lock: false, scaleX: 1, scaleY: 1 },
							interactive: {
								base: [
									{
										type: "click",
										name: "当点击项时",
										show: false,
										fields: [
											{ key: "x", variable: "", description: "x轴" },
											{ key: "y", variable: "", description: "y轴" },
											{ key: "s", variable: "", description: "系列" },
										],
									},
								],
							},
							data: {
								request: {
									url: "",
									method: "GET",
									headers: "{}",
									body: "{}",
									frequency: { show: false, value: 5 },
									type: "static",
									value: [
										{ x: "08-01", y: 20 },
										{ x: "08-02", y: 172 },
										{ x: "08-03", y: 53 },
										{ x: "08-04", y: 109 },
										{ x: "08-05", y: 32 },
										{ x: "08-06", y: 189 },
										{ x: "08-07", y: 79 },
										{ x: "08-08", y: 96 },
										{ x: "08-09", y: 23 },
										{ x: "08-10", y: 169 },
									],
									valueType: "array",
									mock: { random: true, total: 20, fields: [] },
									serviceRequest: false,
								},
								filter: {
									show: false,
									fields: [],
									value: [],
									map: [
										{
											field: "x",
											map: "",
											description: "x轴",
											id: "x",
											type: "string",
										},
										{
											field: "y",
											map: "",
											description: "y轴",
											id: "y",
											type: "number",
										},
										{
											field: "s",
											map: "",
											description: "系列",
											id: "s",
											type: "string",
										},
									],
								},
							},
							options: {
								grid: { left: 60, top: 40, right: 40, bottom: 60, show: true },
								legend: {
									show: true,
									orient: "horizontal",
									itemGap: 10,
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									left: "center",
									top: "bottom",
									align: "auto",
									itemStyle: {
										itemWidth: 14,
										itemHeight: 14,
										icon: "rect",
										sizeIgnore: true,
									},
								},
								xAxis: {
									show: true,
									position: "bottom",
									axisLabel: {
										rotate: 0,
										margin: 8,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									name: "",
								},
								yAxis: {
									show: true,
									axisLabel: {
										rotate: 0,
										margin: 8,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									name: "",
									position: "left",
									splitLine: {
										show: false,
										lineStyle: {
											width: 1,
											type: "solid",
											color: { r: 78, g: 163, b: 151, a: 0.4 },
										},
									},
								},
								tooltip: {
									show: true,
									formatter: "",
									backgroundColor: { r: 78, g: 163, b: 151, a: 0.6 },
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 14,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									animation: { show: false, speed: 5000 },
								},
								animation: {
									animation: true,
									animationDuration: 2000,
									animationEasing: "quadraticInOut",
								},
								series: {
									showBackground: false,
									backgroundStyle: {
										color: { r: 180, g: 180, b: 180, a: 0.2 },
									},
									label: {
										show: false,
										position: "inside",
										rotate: 0,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									itemStyle: { color: [] },
									barGap: 1,
									barWidth: "auto",
								},
								condition: {
									value: [
										{
											id: "3hNV88IR-nlG1j1E67KBF",
											action: "hidden",
											type: "condition",
											value: {
												code: {
													relation: [],
													code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
												},
												condition: {
													id: "40nFXZSH07Y_cidi26giv",
													type: "and",
													rule: [
														{
															id: "EPPHOXjW9SvsSH20rryY3",
															type: "and",
															rule: [
																{
																	id: "9Nh8SJJw7EZGY7uLWg6_3",
																	params: "",
																	condition: "equal",
																	value: "",
																},
															],
														},
													],
												},
											},
										},
									],
									initialState: "visible",
								},
							},
						},
						components: [],
						icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARIAAACxCAMAAAA/FsLlAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAArVQTFRF////////////////////////AAAA////////////////////////////////////////////////////////////////TqOXTqOXTqOXTqOXTqOXTqOXTqOXTqOXTqOXTqOXTqOXTqOX////////////////////////////////////////////////////////////////TqOXTqOXTqOXTqOXTqOXTqOXTqOXTqOXTqSXTqOXTqOXTqSX////////////////////////////////////////////////////////////////////////////////////////////////TqOXTqOXTqOXTqOX////////////////////////////////////////////////////TqOXTqOXTqOXTqOXTqOXTqOXTqOXTqOXTqOX////////////////////////////////////////TqOXTqOXTqOXTqKXTqSXTqOXTqOXTqOX////////////////////////////////////////TqOXTqOX////////////bnB5bnB5UZ6UUKCVUZ6UWZGMUKCVVpeQUZ6UUZ+VXIyKUKCVU5qSUpyTUJ+VYoSFbnF5bnB5bnB5Zn2BY4GDZnyAbnB5bHN7a3V8Z3yAZX6BbXJ6ZICCand9bnB5aHl+ZX+CbXF6bnB5bnB5bnB5bnB5////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////C/KlpwAAAOd0Uk5TGy4JGDEOAF9zaJFQa1FblUFtSUQqTR8Pehsf/v83d82blMASEDwMf16QY2V9mz8eO1krVX1QraIjUUQEb9ULDRkHgGxLdWCjOG4lRmJmh29daTYshkd6KLm4Fyl2RUi0N353XAETDwQU4vdPFemR45o+MoOFOUBS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",
						name: "基础柱形图",
						componentType: "BAR_BASIC",
						id: "yAHx54fPeQr3ObAVQ0Qph",
						parent: "AE3Y86gUv2zymnaZLH6vQ",
					},
					{
						description: "",
						type: "COMPONENT",
						config: {
							style: {
								width: 400,
								height: 400,
								left: 578,
								top: 106,
								opacity: 1,
								rotate: 0,
								zIndex: 2,
								skew: { x: 0, y: 0 },
							},
							attr: { visible: true, lock: false, scaleX: 1, scaleY: 1 },
							interactive: {
								base: [
									{
										type: "click",
										name: "当点击项时",
										show: false,
										fields: [
											{ key: "x", variable: "", description: "x轴" },
											{ key: "y", variable: "", description: "y轴" },
											{ key: "s", variable: "", description: "系列" },
										],
									},
								],
							},
							data: {
								request: {
									url: "",
									method: "GET",
									headers: "{}",
									body: "{}",
									frequency: { show: false, value: 5 },
									type: "static",
									value: [
										{ x: "08-01", y: 200 },
										{ x: "08-02", y: 100 },
										{ x: "08-03", y: 87 },
										{ x: "08-04", y: 105 },
										{ x: "08-05", y: 118 },
										{ x: "08-06", y: 54 },
										{ x: "08-07", y: 75 },
										{ x: "08-08", y: 120 },
										{ x: "08-09", y: 65 },
										{ x: "08-10", y: 57 },
									],
									valueType: "array",
									mock: { random: true, total: 20, fields: [] },
									serviceRequest: false,
								},
								filter: {
									show: false,
									fields: [],
									value: [],
									map: [
										{
											field: "x",
											map: "",
											description: "x轴",
											id: "x",
											type: "string",
										},
										{
											field: "y",
											map: "",
											description: "y轴",
											id: "y",
											type: "number",
										},
										{
											field: "s",
											map: "",
											description: "系列",
											id: "s",
											type: "string",
										},
									],
								},
							},
							options: {
								grid: { left: 60, top: 40, right: 40, bottom: 60, show: true },
								legend: {
									show: true,
									orient: "horizontal",
									itemGap: 10,
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									left: "center",
									top: "bottom",
									align: "auto",
									itemStyle: {
										itemWidth: 14,
										itemHeight: 14,
										icon: "rect",
										sizeIgnore: true,
									},
								},
								xAxis: {
									show: true,
									position: "bottom",
									axisLabel: {
										rotate: 0,
										margin: 8,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									name: "",
								},
								yAxis: {
									show: true,
									axisLabel: {
										rotate: 0,
										margin: 8,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									name: "",
									position: "left",
									splitLine: {
										show: false,
										lineStyle: {
											width: 1,
											type: "solid",
											color: { r: 78, g: 163, b: 151, a: 0.4 },
										},
									},
								},
								tooltip: {
									show: true,
									formatter: "",
									backgroundColor: { r: 78, g: 163, b: 151, a: 0.6 },
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 14,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									animation: { show: false, speed: 5000 },
								},
								animation: {
									animation: true,
									animationDuration: 2000,
									animationEasing: "quadraticInOut",
								},
								series: {
									showBackground: false,
									backgroundStyle: {
										type: "linear",
										linearPosition: { startX: 0, startY: 0, endX: 1, endY: 1 },
										radialPosition: { x: 0.5, y: 0.5, r: 5 },
										start: { r: 180, g: 180, b: 180, a: 0.2 },
										end: { r: 180, g: 180, b: 180, a: 0.2 },
									},
									label: {
										show: false,
										position: "inside",
										rotate: 0,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									itemStyle: {
										color: [
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 78, g: 163, b: 151 },
												end: { r: 78, g: 163, b: 151, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 34, g: 195, b: 170 },
												end: { r: 34, g: 195, b: 170, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 123, g: 217, b: 165 },
												end: { r: 123, g: 217, b: 165, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 208, g: 100, b: 138 },
												end: { r: 208, g: 100, b: 138, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 245, g: 141, b: 178 },
												end: { r: 245, g: 141, b: 178, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 242, g: 179, b: 201 },
												end: { r: 242, g: 179, b: 201, a: 0.2 },
											},
										],
									},
									barGap: 1,
									barWidth: "auto",
								},
								condition: {
									value: [
										{
											id: "2bBfDSmTdwSvA_MyZIKJU",
											action: "hidden",
											type: "condition",
											value: {
												code: {
													relation: [],
													code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
												},
												condition: {
													id: "eHS5PjKERugU7HutziHjE",
													type: "and",
													rule: [
														{
															id: "8JMX4KEI4vp6CSsVjhfsY",
															type: "and",
															rule: [
																{
																	id: "71lEoOTn2TdJJWnuIYaVJ",
																	params: "",
																	condition: "equal",
																	value: "",
																},
															],
														},
													],
												},
											},
										},
									],
									initialState: "visible",
								},
							},
						},
						components: [],
						icon: "/static/radial-bar.fe8f6b33.png",
						name: "渐变柱形图",
						componentType: "RADIAL_BAR",
						id: "Bj-WxGyt1mwozAzwjvLqR",
						parent: "AE3Y86gUv2zymnaZLH6vQ",
					},
				],
			},
			{
				id: "wlgzJ946demyEUEUWBBn6",
				description: "组-1660014905586",
				name: "组-1660014905586",
				type: "GROUP_COMPONENT",
				componentType: "GROUP_COMPONENT",
				config: {
					style: {
						width: 1714,
						height: 749,
						left: 108,
						top: 127,
						opacity: 1,
						rotate: 0,
						zIndex: 2,
						skew: { x: 0, y: 0 },
					},
					attr: { visible: true, lock: false },
					options: {
						condition: {
							value: [
								{
									id: "ppGGh1LVFzakhokOIigk6",
									action: "hidden",
									type: "condition",
									value: {
										code: {
											relation: [],
											code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
										},
										condition: {
											id: "OseK3caj6AjPH_248djwr",
											type: "and",
											rule: [
												{
													id: "mT0UWKn2dz0vq63deJRTH",
													type: "and",
													rule: [
														{
															id: "ijz7-2VGdXpTl30Y9EyGE",
															params: "",
															condition: "equal",
															value: "",
														},
													],
												},
											],
										},
									},
								},
							],
							initialState: "visible",
						},
					},
				},
				components: [
					{
						description: "",
						type: "COMPONENT",
						config: {
							style: {
								width: 400,
								height: 300,
								left: 0,
								top: 449,
								opacity: 1,
								rotate: 0,
								zIndex: 2,
								skew: { x: 0, y: 0 },
							},
							attr: { visible: true, lock: false, scaleX: 1, scaleY: 1 },
							interactive: {
								base: [
									{
										type: "click",
										name: "当点击项时",
										show: false,
										fields: [
											{ key: "name", variable: "", description: "名称" },
											{ key: "value", variable: "", description: "值" },
										],
									},
								],
							},
							data: {
								request: {
									url: "",
									method: "GET",
									headers: "{}",
									body: "{}",
									frequency: { show: false, value: 5 },
									type: "static",
									value: [
										{ name: "白明", value: 182 },
										{ name: "崔静", value: 52 },
										{ name: "乔秀兰", value: 49 },
										{ name: "薛娜", value: 181 },
										{ name: "魏强", value: 18 },
									],
									valueType: "array",
									mock: { random: true, total: 20, fields: [] },
									serviceRequest: false,
								},
								filter: {
									show: false,
									fields: [],
									value: [],
									map: [
										{
											field: "name",
											map: "",
											description: "名称",
											id: "name",
											type: "string",
										},
										{
											field: "value",
											map: "",
											description: "值",
											id: "value",
											type: "number",
										},
									],
								},
							},
							options: {
								grid: { left: 160, top: 40, right: 60, bottom: 60, show: true },
								yAxis: {
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									rankIcon: {
										show: true,
										textStyle: {
											color: { r: 255, g: 255, b: 255 },
											fontSize: 12,
											fontWeight: "bold",
											fontFamily: "sans-serif",
										},
										showBackground: true,
									},
								},
								tooltip: {
									show: true,
									formatter: "{b0}: {c0}",
									backgroundColor: { r: 78, g: 163, b: 151, a: 0.6 },
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 14,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									animation: { show: false, speed: 5000 },
								},
								animation: {
									animation: true,
									animationDuration: 2000,
									animationEasing: "quadraticInOut",
								},
								series: {
									backgroundStyle: {
										show: true,
										color: { r: 78, g: 163, b: 151, a: 0.3 },
									},
									itemStyle: {
										color: [
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 78, g: 163, b: 151 },
												end: { r: 78, g: 163, b: 151, a: 0.4 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 34, g: 195, b: 170 },
												end: { r: 34, g: 195, b: 170, a: 0.4 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 123, g: 217, b: 165 },
												end: { r: 123, g: 217, b: 165, a: 0.4 },
											},
										],
										defaultColor: {
											type: "linear",
											linearPosition: {
												startX: 0.6,
												startY: 0,
												endX: 0.4,
												endY: 1,
											},
											radialPosition: { x: 0.5, y: 0.5, r: 5 },
											start: { r: 208, g: 100, b: 138 },
											end: { r: 208, g: 100, b: 138, a: 0.6 },
										},
									},
									barWidth: 12,
									label: {
										show: true,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
										formatter: "{value}",
										position: "deep-top",
									},
									borderRadius: 30,
								},
								condition: {
									value: [
										{
											id: "F-1blaMaf2TSTxPePumHI",
											action: "hidden",
											type: "condition",
											value: {
												code: {
													relation: [],
													code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
												},
												condition: {
													id: "eL6bJhZZ86SytumnWw3MG",
													type: "and",
													rule: [
														{
															id: "aMmbBNWX7EngbPSoeKhFK",
															type: "and",
															rule: [
																{
																	id: "52n7zX2Gh1hpMV8vNYbN-",
																	params: "",
																	condition: "equal",
																	value: "",
																},
															],
														},
													],
												},
											},
										},
									],
									initialState: "visible",
								},
							},
						},
						components: [],
						icon: "data:image/png;base64,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",
						name: "排名",
						componentType: "RANK_BAR",
						id: "B5IUX4OqZGBIIy05g_tWv",
						parent: "wlgzJ946demyEUEUWBBn6",
					},
					{
						description: "",
						type: "COMPONENT",
						config: {
							style: {
								width: 400,
								height: 400,
								left: 1314,
								top: 0,
								opacity: 1,
								rotate: 0,
								zIndex: 2,
								skew: { x: 0, y: 0 },
							},
							attr: { visible: true, lock: false, scaleX: 1, scaleY: 1 },
							interactive: {
								base: [
									{
										type: "click",
										name: "当点击项时",
										show: false,
										fields: [
											{ key: "x", variable: "", description: "x轴" },
											{ key: "y", variable: "", description: "y轴" },
											{ key: "s", variable: "", description: "系列" },
										],
									},
								],
							},
							data: {
								request: {
									url: "",
									method: "GET",
									headers: "{}",
									body: "{}",
									frequency: { show: false, value: 5 },
									type: "static",
									value: [
										{ x: "08-01", y: 200 },
										{ x: "08-02", y: 100 },
										{ x: "08-03", y: 87 },
										{ x: "08-04", y: 105 },
										{ x: "08-05", y: 118 },
										{ x: "08-06", y: 54 },
										{ x: "08-07", y: 75 },
										{ x: "08-08", y: 120 },
										{ x: "08-09", y: 65 },
										{ x: "08-10", y: 57 },
									],
									valueType: "array",
									mock: { random: true, total: 20, fields: [] },
									serviceRequest: false,
								},
								filter: {
									show: false,
									fields: [],
									value: [],
									map: [
										{
											field: "x",
											map: "",
											description: "x轴",
											id: "x",
											type: "string",
										},
										{
											field: "y",
											map: "",
											description: "y轴",
											id: "y",
											type: "number",
										},
										{
											field: "s",
											map: "",
											description: "系列",
											id: "s",
											type: "string",
										},
									],
								},
							},
							options: {
								grid: { left: 60, top: 40, right: 40, bottom: 60, show: true },
								legend: {
									show: true,
									orient: "horizontal",
									itemGap: 10,
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									left: "center",
									top: "bottom",
									align: "auto",
									itemStyle: {
										itemWidth: 14,
										itemHeight: 14,
										icon: "rect",
										sizeIgnore: true,
									},
								},
								xAxis: {
									show: true,
									position: "bottom",
									axisLabel: {
										rotate: 0,
										margin: 8,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									name: "",
								},
								yAxis: {
									show: true,
									axisLabel: {
										rotate: 0,
										margin: 8,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									name: "",
									position: "left",
									splitLine: {
										show: false,
										lineStyle: {
											width: 1,
											type: "solid",
											color: { r: 78, g: 163, b: 151, a: 0.4 },
										},
									},
								},
								tooltip: {
									show: true,
									formatter: "",
									backgroundColor: { r: 78, g: 163, b: 151, a: 0.6 },
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 14,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									animation: { show: false, speed: 5000 },
								},
								animation: {
									animation: true,
									animationDuration: 2000,
									animationEasing: "quadraticInOut",
								},
								series: {
									showBackground: false,
									backgroundStyle: {
										type: "linear",
										linearPosition: { startX: 0, startY: 0, endX: 1, endY: 1 },
										radialPosition: { x: 0.5, y: 0.5, r: 5 },
										start: { r: 180, g: 180, b: 180, a: 0.2 },
										end: { r: 180, g: 180, b: 180, a: 0.2 },
									},
									label: {
										show: false,
										position: "inside",
										rotate: 0,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									itemStyle: {
										color: [
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 78, g: 163, b: 151 },
												end: { r: 78, g: 163, b: 151, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 34, g: 195, b: 170 },
												end: { r: 34, g: 195, b: 170, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 123, g: 217, b: 165 },
												end: { r: 123, g: 217, b: 165, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 208, g: 100, b: 138 },
												end: { r: 208, g: 100, b: 138, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 245, g: 141, b: 178 },
												end: { r: 245, g: 141, b: 178, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 242, g: 179, b: 201 },
												end: { r: 242, g: 179, b: 201, a: 0.2 },
											},
										],
									},
									barGap: 1,
									barWidth: "auto",
								},
								condition: {
									value: [
										{
											id: "1Ktxvlq4c1fIl9IkX7XF0",
											action: "hidden",
											type: "condition",
											value: {
												code: {
													relation: [],
													code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
												},
												condition: {
													id: "0JcrRlWPbs1D6cBaEsWTA",
													type: "and",
													rule: [
														{
															id: "OiyxVryfCh1bVsLJGnQqG",
															type: "and",
															rule: [
																{
																	id: "-Iq5H1-cEyvCMUQxgDmDB",
																	params: "",
																	condition: "equal",
																	value: "",
																},
															],
														},
													],
												},
											},
										},
									],
									initialState: "visible",
								},
							},
						},
						components: [],
						icon: "/static/radial-bar.fe8f6b33.png",
						name: "渐变柱形图",
						componentType: "RADIAL_BAR",
						id: "p3UgGeBjyK8u_h-HdcdyS",
						parent: "wlgzJ946demyEUEUWBBn6",
					},
				],
			},
			{
				id: "SYP3MO_iYb7yD4lyaz6fc",
				description: "组-1660014932457",
				name: "组-1660014932457",
				type: "GROUP_COMPONENT",
				componentType: "GROUP_COMPONENT",
				config: {
					style: {
						width: 1088,
						height: 943,
						left: 120,
						top: 40,
						opacity: 1,
						rotate: 0,
						zIndex: 2,
						skew: { x: 0, y: 0 },
					},
					attr: { visible: true, lock: false },
					options: {
						condition: {
							value: [
								{
									id: "4KX3D8EBnvIegXUbbj1da",
									action: "hidden",
									type: "condition",
									value: {
										code: {
											relation: [],
											code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
										},
										condition: {
											id: "B4MyOs4nOTkUga3ekubXS",
											type: "and",
											rule: [
												{
													id: "mL8o5MreKgcKrXXI5cwCT",
													type: "and",
													rule: [
														{
															id: "wfAhEjM6M4dxHvqMeOggz",
															params: "",
															condition: "equal",
															value: "",
														},
													],
												},
											],
										},
									},
								},
							],
							initialState: "visible",
						},
					},
				},
				components: [
					{
						description: "",
						type: "COMPONENT",
						config: {
							style: {
								width: 400,
								height: 400,
								left: 504,
								top: 543,
								opacity: 1,
								rotate: 0,
								zIndex: 2,
								skew: { x: 0, y: 0 },
							},
							attr: { visible: true, lock: false, scaleX: 1, scaleY: 1 },
							interactive: {
								base: [
									{
										type: "click",
										name: "当点击项时",
										show: false,
										fields: [
											{ key: "x", variable: "", description: "x轴" },
											{ key: "y", variable: "", description: "y轴" },
											{ key: "s", variable: "", description: "系列" },
										],
									},
								],
							},
							data: {
								request: {
									url: "",
									method: "GET",
									headers: "{}",
									body: "{}",
									frequency: { show: false, value: 5 },
									type: "static",
									value: [
										{ x: "08-01", y: 162 },
										{ x: "08-02", y: 142 },
										{ x: "08-03", y: 95 },
										{ x: "08-04", y: 54 },
										{ x: "08-05", y: 84 },
										{ x: "08-06", y: 64 },
										{ x: "08-07", y: 192 },
										{ x: "08-08", y: 177 },
										{ x: "08-09", y: 10 },
										{ x: "08-10", y: 74 },
									],
									valueType: "array",
									mock: { random: true, total: 20, fields: [] },
									serviceRequest: false,
								},
								filter: {
									show: false,
									fields: [],
									value: [],
									map: [
										{
											field: "x",
											map: "",
											description: "x轴",
											id: "x",
											type: "string",
										},
										{
											field: "y",
											map: "",
											description: "y轴",
											id: "y",
											type: "number",
										},
										{
											field: "s",
											map: "",
											description: "系列",
											id: "s",
											type: "string",
										},
									],
								},
							},
							options: {
								grid: { left: 60, top: 40, right: 40, bottom: 60, show: true },
								legend: {
									show: true,
									orient: "horizontal",
									itemGap: 10,
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									left: "center",
									top: "bottom",
									align: "auto",
									itemStyle: {
										itemWidth: 14,
										itemHeight: 14,
										icon: "rect",
										sizeIgnore: true,
									},
								},
								xAxis: {
									show: true,
									axisLabel: {
										rotate: 0,
										margin: 8,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									name: "",
								},
								yAxis: {
									show: true,
									axisLabel: {
										rotate: 0,
										margin: 8,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									name: "",
								},
								tooltip: {
									show: true,
									formatter: "",
									backgroundColor: { r: 78, g: 163, b: 151, a: 0.6 },
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 14,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									animation: { show: false, speed: 5000 },
								},
								animation: {
									animation: true,
									animationDuration: 2000,
									animationEasing: "quadraticInOut",
								},
								series: {
									backgroundStyle: {
										backgroundColor: { r: 180, g: 180, b: 180, a: 0.2 },
										borderColor: { r: 180, g: 180, b: 180 },
										borderRadius: 20,
										borderWidth: 2,
									},
									label: {
										show: false,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									itemStyle: {
										color: [
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 78, g: 163, b: 151 },
												end: { r: 78, g: 163, b: 151, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 34, g: 195, b: 170 },
												end: { r: 34, g: 195, b: 170, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 123, g: 217, b: 165 },
												end: { r: 123, g: 217, b: 165, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 208, g: 100, b: 138 },
												end: { r: 208, g: 100, b: 138, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 245, g: 141, b: 178 },
												end: { r: 245, g: 141, b: 178, a: 0.2 },
											},
											{
												type: "linear",
												linearPosition: {
													startX: 0.6,
													startY: 0,
													endX: 0.4,
													endY: 1,
												},
												radialPosition: { x: 0.5, y: 0.5, r: 5 },
												start: { r: 242, g: 179, b: 201 },
												end: { r: 242, g: 179, b: 201, a: 0.2 },
											},
										],
									},
									barWidth: 10,
									borderRadius: 10,
								},
								condition: {
									value: [
										{
											id: "9ZUdSdMz-beiGgz6Ylm0B",
											action: "hidden",
											type: "condition",
											value: {
												code: {
													relation: [],
													code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
												},
												condition: {
													id: "AcN18VSM_eZ_cf-H67wpl",
													type: "and",
													rule: [
														{
															id: "sFpatTcq15LvI0ZmZIqN7",
															type: "and",
															rule: [
																{
																	id: "hiSzRdIxFrYgcUEXebxer",
																	params: "",
																	condition: "equal",
																	value: "",
																},
															],
														},
													],
												},
											},
										},
									],
									initialState: "visible",
								},
							},
						},
						components: [],
						icon: "data:image/png;base64,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",
						name: "胶囊图",
						componentType: "CACHET_BAR",
						id: "3wJkWmGGV6Rx7F054hvYx",
						parent: "SYP3MO_iYb7yD4lyaz6fc",
					},
					{
						description: "",
						type: "COMPONENT",
						config: {
							style: {
								width: 400,
								height: 400,
								left: 688,
								top: 0,
								opacity: 1,
								rotate: 0,
								zIndex: 2,
								skew: { x: 0, y: 0 },
							},
							attr: { visible: true, lock: false, scaleX: 1, scaleY: 1 },
							interactive: {
								base: [
									{
										type: "click",
										name: "当点击项时",
										show: false,
										fields: [
											{ key: "name", variable: "", description: "数据名" },
											{ key: "value", variable: "", description: "数据值" },
										],
									},
								],
							},
							data: {
								request: {
									url: "",
									method: "GET",
									headers: "{}",
									body: "{}",
									frequency: { show: false, value: 5 },
									type: "static",
									value: [
										{ name: "熊杰", value: 48 },
										{ name: "乔平", value: 40 },
										{ name: "江刚", value: 11 },
										{ name: "罗磊", value: 50 },
										{ name: "朱磊", value: 33 },
									],
									valueType: "array",
									mock: { random: true, total: 20, fields: [] },
									serviceRequest: false,
								},
								filter: {
									show: false,
									fields: [],
									value: [],
									map: [
										{
											field: "name",
											map: "",
											description: "数据名",
											id: "name",
											type: "string",
										},
										{
											field: "value",
											map: "",
											description: "数据值",
											id: "value",
											type: "number",
										},
									],
								},
							},
							options: {
								polar: { radius: [0, 60] },
								angleAxis: {
									min: 0,
									max: 100,
									startAngle: 90,
									axisLabel: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
										show: true,
										margin: 8,
									},
								},
								legend: {
									show: true,
									orient: "horizontal",
									itemGap: 10,
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									left: "center",
									top: "bottom",
									align: "auto",
									itemStyle: {
										itemWidth: 14,
										itemHeight: 14,
										icon: "rect",
										sizeIgnore: true,
									},
								},
								tooltip: {
									show: true,
									formatter: "",
									backgroundColor: { r: 78, g: 163, b: 151, a: 0.6 },
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 14,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
								},
								animation: {
									animation: true,
									animationDuration: 2000,
									animationEasing: "quadraticInOut",
								},
								series: {
									label: {
										show: false,
										position: "inside",
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									itemStyle: { color: [] },
									barWidth: 20,
								},
								condition: {
									value: [
										{
											id: "Ak0hngOY1MFq9FN_kGnen",
											action: "hidden",
											type: "condition",
											value: {
												code: {
													relation: [],
													code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
												},
												condition: {
													id: "lin9XT5dGsIsf-2VY9hRp",
													type: "and",
													rule: [
														{
															id: "KfEVnYy9Vq2r5hh_KGnrs",
															type: "and",
															rule: [
																{
																	id: "n0U-W4xIuSnztC-h3Le3B",
																	params: "",
																	condition: "equal",
																	value: "",
																},
															],
														},
													],
												},
											},
										},
									],
									initialState: "visible",
								},
							},
						},
						components: [],
						icon: "data:image/png;base64,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",
						name: "极坐标柱形图",
						componentType: "POLAR_BAR",
						id: "jKWtuJPW4pfTy0UWaatra",
						parent: "SYP3MO_iYb7yD4lyaz6fc",
					},
					{
						description: "",
						type: "COMPONENT",
						config: {
							style: {
								width: 400,
								height: 400,
								left: 0,
								top: 118,
								opacity: 1,
								rotate: 0,
								zIndex: 2,
								skew: { x: 0, y: 0 },
							},
							attr: { visible: true, lock: false, scaleX: 1, scaleY: 1 },
							interactive: {
								base: [
									{
										type: "click",
										name: "当点击项时",
										show: false,
										fields: [
											{ key: "x", variable: "", description: "x轴" },
											{ key: "y", variable: "", description: "y轴" },
										],
									},
								],
							},
							data: {
								request: {
									url: "",
									method: "GET",
									headers: "{}",
									body: "{}",
									frequency: { show: false, value: 5 },
									type: "static",
									value: [
										{ x: "08-01", y: 37 },
										{ x: "08-02", y: 94 },
										{ x: "08-03", y: 7 },
										{ x: "08-04", y: 198 },
										{ x: "08-05", y: 199 },
										{ x: "08-06", y: 162 },
										{ x: "08-07", y: 0 },
										{ x: "08-08", y: 172 },
										{ x: "08-09", y: 142 },
										{ x: "08-10", y: 70 },
									],
									valueType: "array",
									mock: { random: true, total: 20, fields: [] },
									serviceRequest: false,
								},
								filter: {
									show: false,
									fields: [],
									value: [],
									map: [
										{
											field: "x",
											map: "",
											description: "x轴",
											id: "x",
											type: "string",
										},
										{
											field: "y",
											map: "",
											description: "y轴",
											id: "y",
											type: "number",
										},
									],
								},
							},
							options: {
								xAxis: {
									show: true,
									position: "bottom",
									axisLabel: {
										rotate: 0,
										margin: 8,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									name: "",
								},
								grid: { left: 60, top: 40, right: 40, bottom: 60, show: true },
								yAxis: {
									show: true,
									axisLabel: {
										rotate: 0,
										margin: 8,
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									name: "",
									position: "left",
									splitLine: {
										show: false,
										lineStyle: {
											width: 1,
											type: "solid",
											color: { r: 78, g: 163, b: 151, a: 0.4 },
										},
									},
								},
								tooltip: {
									show: true,
									formatter: "",
									backgroundColor: { r: 78, g: 163, b: 151, a: 0.6 },
									textStyle: {
										color: { r: 255, g: 255, b: 255 },
										fontSize: 14,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									animation: { show: false, speed: 5000 },
								},
								animation: {
									animation: true,
									animationDuration: 2000,
									animationEasing: "quadraticInOut",
								},
								series: {
									label: {
										show: false,
										position: "inside",
										color: { r: 255, g: 255, b: 255 },
										fontSize: 12,
										fontWeight: "normal",
										fontFamily: "sans-serif",
									},
									itemStyle: {
										color: {
											type: "linear",
											linearPosition: {
												startX: 0.6,
												startY: 0,
												endX: 0.4,
												endY: 1,
											},
											radialPosition: { x: 0.5, y: 0.5, r: 5 },
											start: { r: 78, g: 163, b: 151 },
											end: { r: 78, g: 163, b: 151, a: 0.2 },
										},
									},
									barWidth: 20,
								},
								condition: {
									value: [
										{
											id: "VtP4CqwE3ewa9hR4vpGNT",
											action: "hidden",
											type: "condition",
											value: {
												code: {
													relation: [],
													code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
												},
												condition: {
													id: "H_giaxtFvFh-gQSvibhY9",
													type: "and",
													rule: [
														{
															id: "rudYCjmNhRZwZT-YI_OK7",
															type: "and",
															rule: [
																{
																	id: "b1dCqh7WtrBm2SpaBI8ey",
																	params: "",
																	condition: "equal",
																	value: "",
																},
															],
														},
													],
												},
											},
										},
									],
									initialState: "visible",
								},
							},
						},
						components: [],
						icon: "data:image/png;base64,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",
						name: "瀑布图",
						componentType: "WATER_FALL_BAR",
						id: "HxJOWfyNk9_LNjpZnOlUV",
						parent: "SYP3MO_iYb7yD4lyaz6fc",
					},
				],
			},
			{
				description: "",
				type: "COMPONENT",
				config: {
					style: {
						width: 400,
						height: 400,
						left: 117,
						top: -5,
						opacity: 1,
						rotate: 0,
						zIndex: 2,
						skew: { x: 0, y: 0 },
					},
					attr: { visible: true, lock: false },
					interactive: {
						base: [
							{
								type: "click",
								name: "当点击项时",
								show: false,
								fields: [
									{ key: "name", variable: "", description: "数据名" },
									{ key: "value", variable: "", description: "数据值" },
								],
							},
						],
					},
					data: {
						request: {
							url: "",
							method: "GET",
							headers: "{}",
							body: "{}",
							frequency: { show: false, value: 5 },
							type: "static",
							value: [
								{ name: "熊杰", value: 48 },
								{ name: "乔平", value: 40 },
								{ name: "江刚", value: 11 },
								{ name: "罗磊", value: 50 },
								{ name: "朱磊", value: 33 },
							],
							valueType: "array",
							mock: { random: true, total: 20, fields: [] },
							serviceRequest: false,
						},
						filter: {
							show: false,
							fields: [],
							value: [],
							map: [
								{
									field: "name",
									map: "",
									description: "数据名",
									id: "name",
									type: "string",
								},
								{
									field: "value",
									map: "",
									description: "数据值",
									id: "value",
									type: "number",
								},
							],
						},
					},
					options: {
						polar: { radius: [0, 60] },
						angleAxis: {
							min: 0,
							max: 100,
							startAngle: 90,
							axisLabel: {
								color: { r: 255, g: 255, b: 255 },
								fontSize: 12,
								fontWeight: "normal",
								fontFamily: "sans-serif",
								show: true,
								margin: 8,
							},
						},
						legend: {
							show: true,
							orient: "horizontal",
							itemGap: 10,
							textStyle: {
								color: { r: 255, g: 255, b: 255 },
								fontSize: 12,
								fontWeight: "normal",
								fontFamily: "sans-serif",
							},
							left: "center",
							top: "bottom",
							align: "auto",
							itemStyle: {
								itemWidth: 14,
								itemHeight: 14,
								icon: "rect",
								sizeIgnore: true,
							},
						},
						tooltip: {
							show: true,
							formatter: "",
							backgroundColor: { r: 78, g: 163, b: 151, a: 0.6 },
							textStyle: {
								color: { r: 255, g: 255, b: 255 },
								fontSize: 14,
								fontWeight: "normal",
								fontFamily: "sans-serif",
							},
						},
						animation: {
							animation: true,
							animationDuration: 2000,
							animationEasing: "quadraticInOut",
						},
						series: {
							label: {
								show: false,
								position: "inside",
								color: { r: 255, g: 255, b: 255 },
								fontSize: 12,
								fontWeight: "normal",
								fontFamily: "sans-serif",
							},
							itemStyle: { color: [] },
							barWidth: 20,
						},
						condition: {
							value: [
								{
									id: "KyypD5Ssjp1VHs7hROKcI",
									action: "hidden",
									type: "condition",
									value: {
										code: {
											relation: [],
											code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
										},
										condition: {
											id: "n1kz3LhI5rRO8MAMdusU4",
											type: "and",
											rule: [
												{
													id: "6FuwyGJBS9pKslDNYEym7",
													type: "and",
													rule: [
														{
															id: "twpNu3m61VHzXHemTatHe",
															params: "",
															condition: "equal",
															value: "",
														},
													],
												},
											],
										},
									},
								},
							],
							initialState: "visible",
						},
					},
				},
				components: [],
				icon: "data:image/png;base64,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",
				name: "极坐标柱形图",
				componentType: "POLAR_BAR",
				id: "kh7jazisTJk6gahWI9e8w",
			},
			{
				description: "",
				type: "COMPONENT",
				config: {
					style: {
						width: 400,
						height: 400,
						left: 604,
						top: 97,
						opacity: 1,
						rotate: 0,
						zIndex: 2,
						skew: { x: 0, y: 0 },
					},
					attr: { visible: true, lock: false },
					interactive: { base: [] },
					data: {
						request: {
							url: "",
							method: "GET",
							headers: "{}",
							body: "{}",
							frequency: { show: false, value: 5 },
							type: "static",
							value: [
								{ name: "于磊", value: 61, max: 100 },
								{ name: "魏丽", value: 51, max: 100 },
								{ name: "孙娜", value: 67, max: 100 },
								{ name: "刘伟", value: 39, max: 100 },
								{ name: "戴军", value: 88, max: 100 },
								{ name: "赵洋", value: 88, max: 100 },
								{ name: "文洋", value: 50, max: 100 },
							],
							valueType: "array",
							mock: { random: true, total: 20, fields: [] },
							serviceRequest: false,
						},
						filter: {
							show: false,
							fields: [],
							value: [],
							map: [
								{
									field: "name",
									map: "",
									description: "数据项",
									id: "name",
									type: "string",
								},
								{
									field: "value",
									map: "",
									description: "数据值",
									id: "value",
									type: "number",
								},
								{
									field: "max",
									map: "",
									description: "最大值",
									id: "max",
									type: "number",
								},
								{
									field: "s",
									map: "",
									description: "系列",
									id: "s",
									type: "string",
								},
							],
						},
					},
					options: {
						condition: {
							value: [
								{
									id: "DpVinhE6x-tCzAqztY_jv",
									action: "hidden",
									type: "condition",
									value: {
										code: {
											relation: [],
											code: "\n            // 可从参数中获取相关数据\n            // 在这里添加逻辑\n            // 返回true | false 表示是否符合条件\n            return true \n          ",
										},
										condition: {
											id: "jqn5TkSnHRcLH2JTKGznI",
											type: "and",
											rule: [
												{
													id: "b6G3fG1Hev-LgbdQ6nMa-",
													type: "and",
													rule: [
														{
															id: "YXFw3MoBJvO11VkNHlMS8",
															params: "",
															condition: "equal",
															value: "",
														},
													],
												},
											],
										},
									},
								},
							],
							initialState: "visible",
						},
						legend: {
							show: true,
							orient: "horizontal",
							itemGap: 10,
							textStyle: {
								color: { r: 255, g: 255, b: 255 },
								fontSize: 12,
								fontWeight: "normal",
								fontFamily: "sans-serif",
							},
							left: "center",
							top: "bottom",
							align: "auto",
							itemStyle: {
								itemWidth: 14,
								itemHeight: 14,
								icon: "rect",
								sizeIgnore: true,
							},
						},
						tooltip: {
							show: true,
							formatter: "",
							backgroundColor: { r: 78, g: 163, b: 151, a: 0.6 },
							textStyle: {
								color: { r: 255, g: 255, b: 255 },
								fontSize: 14,
								fontWeight: "normal",
								fontFamily: "sans-serif",
							},
							animation: { show: false, speed: 5000 },
						},
						animation: {
							animation: true,
							animationDuration: 2000,
							animationEasing: "quadraticInOut",
						},
						radar: {
							center: [50, 50],
							radius: 75,
							axisName: {
								show: true,
								formatter: "{value}",
								color: { r: 255, g: 255, b: 255 },
								fontSize: 12,
								fontWeight: "normal",
								fontFamily: "sans-serif",
							},
							axisNameGap: 15,
							splitNumber: 5,
							shape: "polygon",
							axisLine: {
								show: false,
								lineStyle: {
									color: { r: 78, g: 163, b: 151 },
									width: 1,
									type: "solid",
								},
							},
							splitLine: {
								show: true,
								lineStyle: {
									color: { r: 78, g: 163, b: 151, a: 0.4 },
									width: 1,
									type: "solid",
								},
							},
							splitArea: {
								show: false,
								areaStyle: {
									color: [
										{ r: 78, g: 163, b: 151, a: 0.3 },
										{ r: 34, g: 195, b: 170, a: 0.3 },
									],
								},
							},
						},
						series: {
							label: {
								show: false,
								position: "top",
								distance: 5,
								formatter: "{b}: {c}",
								color: { r: 255, g: 255, b: 255 },
								fontSize: 12,
								fontWeight: "normal",
								fontFamily: "sans-serif",
							},
							itemStyle: { color: [] },
							symbol: "circle",
							symbolSize: 4,
							lineStyle: [],
							areaStyle: { color: [] },
						},
					},
				},
				components: [],
				icon: "data:image/png;base64,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",
				name: "基础雷达图",
				componentType: "RADAR_BASIC",
				id: "OYjA0hkKQiuifB-micQBv",
			},
		],
		poster:
			"http://47.97.27.23/static/image/f6543dfd1e15f8e0ae4e5e1d4e7c975e.jpeg",
		config: {
			style: { width: 1920, height: 1080 },
			attr: {
				poster: { type: "color", color: { r: 5, g: 46, b: 36 } },
				grid: 1,
				filter: [
					{
						id: "2McHFwEKZzC6JV3T7x4lk",
						name: "取前几项",
						code: "\n      // 起始的索引\n      const start = 0 \n      // 结束的索引\n      const end = 10\n      return data.slice(start, end)\n    ",
						editable: false,
						params: [],
					},
					{
						id: "e5xt4JL0yEZIecg8obUis",
						name: "排序(小 -> 大)",
						code: "\n      // 排序的字段\n      const sortKey = 'x'\n\n      return data.sort((a, b) => {\n        return a[sortKey] - b[sortKey]\n      })\n    ",
						editable: false,
						params: [],
					},
					{
						id: "c_DKV4-Vkwmr_ch5gM-Cf",
						name: "排序(大 -> 小)",
						code: "\n      // 排序的字段\n      const sortKey = 'x'\n\n      return data.sort((a, b) => {\n        return b[sortKey] - a[sortKey]\n      })\n    ",
						editable: false,
						params: [],
					},
				],
				params: [],
				constants: [],
				theme: "wonderland",
				guideLine: { 
					show: true, 
					value: [
						{
							type: 'horizontal',
							style: {
								left: 0,
								top: 100,
								width: 1920,
								height:2,
							},
							lineStyle: 'solid',
							id: 'guide-line-id'
						}
					] 
				},
			},
			flag: { type: "PC" },
		},
	},
	version: "1.8",
}

module.exports = {
	MOCK_SCREEN_DATA,
}
