export interface Title {
	english: string;
	japanese: string;
	pretty: string;
}

/** Data about dimensions of an image */
export interface Image {
	/** extension */
	t: string;

	/** width */
	w: number;

	/** height */
	h: number;
}

export interface Images {
	pages?: Image[];
	cover: Image;
	thumbnail: Image;
}

export type TagType = "tag" | "language" | "artist" | "category" | "group" | "parody" | "character";

export interface Tag {
	id: number;
	type: TagType;
	name: string;
	url: string;
	count: number;
}

/** A single doujin */
export interface Doujin {
	id: number;
	media_id: string;
	title: Title;
	images: Images;
	scanlator: string;
	upload_date: number;
	tags?: Tag[];
	num_pages: number;
	num_favorites: number;
}

/** A group of doujins with pagination information */
export interface QueryResponse extends RelatedDoujins {
	num_pages: number;
	per_page: number;
}

/** A group of doujins */
export interface RelatedDoujins {
	result: Doujin[];
	error?: string | boolean;
}
