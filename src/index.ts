import strictUriEncode from "strict-uri-encode";
import { parse, HTMLElement, NodeType } from "node-html-parser";
import rootAxios, { AxiosInstance } from "axios";
import { Doujin, QueryResponse, RelatedDoujins } from "./NhentaiTypes";

export interface Options {
	pagination: number;

	/** Deletes page dimensions information if set to false*/
	includePages: boolean;

	/** Deletes tags if set to false */
	includeTags: boolean;

	/** Automatically sort based on num_favorites */
	sort: boolean;
}

export class NhentaiWrapper {
	public doujinsLimit = 3;
	private readonly axios: AxiosInstance;
	constructor() {
		this.axios = rootAxios.create();
		this.axios.defaults.baseURL = "https://nhentai.net";
	}

	/**
	 * Populates a partial options object with default values
	 * @param options None to all options properties populated
	 * @returns Returns same options but with all properties defuned
	 */
	private populateOptions(options?: Partial<Options>): Options {
		return {
			pagination: options?.pagination ?? 1,
			includePages: options?.includePages ?? false,
			includeTags: options?.includeTags ?? true,
			sort: options?.sort ?? true,
		};
	}

	/** Sorts doujins based on the number of times they've been favorited */
	private sortDoujins<T extends RelatedDoujins>(doujins: T): T {
		doujins.result = doujins.result.sort((a, b) => {
			if (a.num_favorites === b.num_favorites) return 0;
			else return a.num_favorites > b.num_favorites ? -1 : 1;
		});

		return doujins;
	}

	private formatDoujinsBasedOnOptions<T extends RelatedDoujins>(doujins: T, options: Options): T {
		doujins.result.forEach((doujin) => {
			if (options.includePages === false) delete doujin.images.pages;
			if (options.includeTags === false) delete doujin.tags;
		});

		if (options.sort === true) return this.sortDoujins(doujins);
		else return doujins;
	}

	/** Get a single page of doujins related to a term */
	// prettier-ignore
	public async searchTerm(term: string, opts?: Partial<Options>) {
		const options = this.populateOptions(opts);
		term = strictUriEncode(term);
		
		const results = await this.axios.get(`/api/galleries/search?query=${term}&page=${options.pagination}`);
		const response = results.data as QueryResponse;
		if(response.error !== undefined){
			if (typeof response.error === "string") throw new Error(response.error);
			else throw new Error("An error has occured");
		}

		return this.formatDoujinsBasedOnOptions(response, options);
	}

	/** Get a single page of doujins that have a tag */
	// prettier-ignore
	public async searchTag(tag: string, opts?: Partial<Options>){
		const options = this.populateOptions(opts);

		const results = await this.axios.get(`/api/galleries/tagged?tag_id=${tag}&page=${options.pagination}`);
		const response = results.data as QueryResponse;
		if(response.error !== undefined){
			if (typeof response.error === "string") throw new Error(response.error);
			else throw new Error("An error has occured");
		}

		return this.formatDoujinsBasedOnOptions(response, options);
	}

	/** Search for them spicy nuclear codes */
	public async searchDoujin(id: number, opts?: Partial<Options>) {
		const options = this.populateOptions(opts);
		try {
			const results = await this.axios.get(`/api/gallery/${id}`);
			const response = results.data as Doujin;

			// create a temporary variable to format it
			const temp = this.formatDoujinsBasedOnOptions({ result: [response] }, options);

			return temp.result[0];
		} catch {
			return null;
		}
	}

	/**
	 * Fetch all doujins up to a certain limit
	 * @param query The query to be searched, either a search term or a tagID
	 * @param type The type of query to be performed, either "term" or "tag"
	 * @param opts Options to be applied
	 * @returns A single QueryResponse object with all the doujins in result;
	 */
	public async fetchAllDoujins(query: string, type: "term" | "tag", opts?: Partial<Options>) {
		const options = this.populateOptions(opts);
		const searchFunc = type === "term" ? this.searchTerm.bind(this) : this.searchTag.bind(this);
		const doujins = (await searchFunc(query)) as QueryResponse;

		if (doujins.num_pages !== 1) {
			// cap it so we don't get bonked by nhentai
			if (doujins.num_pages > this.doujinsLimit) {
				doujins.num_pages = this.doujinsLimit;
			}

			for (let i = 2; i <= doujins.num_pages; i++) {
				const moreDoujins = await searchFunc(query, {
					pagination: i,
				});

				doujins.result = doujins.result.concat(moreDoujins.result);
			}
		}

		return this.formatDoujinsBasedOnOptions(doujins, options);
	}

	/** Fetches all the doujins based on a code */
	public async fetchRelatedDoujins(id: number, opts?: Partial<Options>) {
		const options = this.populateOptions(opts);
		try {
			const results = await this.axios.get(`/api/gallery/${id}/related`);
			const response = results.data as RelatedDoujins;
			if (response.error !== undefined) throw new Error();

			return this.formatDoujinsBasedOnOptions(response, options);
		} catch {
			throw new Error("Cannot find that doujin");
		}
	}

	/** Get the id of a tag based on the name */
	public async convertTagNameToId(tagname: string) {
		tagname = tagname.replaceAll(" ", "-");

		try {
			// fetches the html and throws an error if the response is not 200
			const response = await this.axios.get(`/tag/${tagname}`);
			if (response.status !== 200) throw new Error();

			// greps for the root html element
			let root = parse(response.data).childNodes.find(({ nodeType }) => nodeType === NodeType.ELEMENT_NODE) as HTMLElement;
			if (root === undefined) throw new Error();

			// get all elements with the class tag
			// then filters it down to one that contains the tag id format
			let tags = root.querySelectorAll(".tag");
			let anchorTag = tags.find((element) => {
				if (element.rawTagName !== "a") return false;
				const classAttr = element["_attrs"].class;
				if (typeof classAttr !== "string") return false;
				return /tag tag-[0-9]+ /i.test(classAttr);
			});
			if (anchorTag === undefined) throw new Error();

			// gets all the numbers from the tag
			const classAttr = anchorTag["_attrs"].class as string;
			const matchedRegex = classAttr.match(/\d/g);
			if (matchedRegex === null) throw new Error();

			// combines the tags before being converted to a number
			const tagId = parseInt(matchedRegex.join(""), 10);
			return tagId;
		} catch (err) {
			if (err instanceof Error && err.message.length === 0) {
				throw new Error("Cannot find that tag name");
			}

			throw new Error(err);
		}
	}

	/** Fetches a random doujin, might take a couple of tries */
	public async getRandomDoujin(opts?: Options): Promise<Doujin> {
		const id = Math.floor(Math.random() * 384151);
		try {
			const doujin = await this.searchDoujin(id, opts);
			if (doujin !== null) return doujin;
			else throw new Error();
		} catch {
			return await this.getRandomDoujin(opts);
		}
	}

	/** Returns the link of the cover of doujin based on the id */
	public getCoverOfMediaId = (id: string) => {
		return `https://t.nhentai.net/galleries/${id}/cover.jpg`;
	};
}

export * from "./NhentaiTypes";

// Documentation
// cover format https://t.nhentai.net/galleries/987560/cover.jpg
// cover thumbnail format https://t2.nhentai.net/galleries/987560/thumb.jpg
// page thumbnail format https://t.nhentai.net/galleries/987560/1t.jpg
// page format https://i.nhentai.net/galleries/987560/1.jpg
// nhentai.net/api/galleries/search?query=metamorphosis&page=1
