# nhentai-wrapper

A promise-based nhentai API wrapper for degenerate developers alike

## Example Usage

```ts
import { NhentaiWrapper, Options } from "@scinorandex/nhentai-wrapper";
const Nhentai = new NhentaiWrapper();

(async () => {
	const options: Options = { includePages: false, includeTags: false };
	const result = await Nhentai.searchDoujin(177013, options);
	console.log(result);
})();
```

Expected output:

```js
{
  id: 177013,
  media_id: '987560',
  title: {
    english: '[ShindoLA] METAMORPHOSIS (Complete) [English]',
    japanese: '',
    pretty: 'METAMORPHOSIS'
  },
  images: {
    cover: { t: 'j', w: 350, h: 506 },
    thumbnail: { t: 'j', w: 250, h: 362 }
  },
  scanlator: '',
  upload_date: 1476793729,
  num_pages: 225,
  num_favorites: 44548
}
```

## Options

All the fetching/searching methods of the library take a Partial<> version of this interface

| Property     | Type    | Description                                                   |
| ------------ | ------- | ------------------------------------------------------------- |
| pagination   | number  | The page of results to be retrieved                           |
| includePages | boolean | Dictates if page dimensions will be removed                   |
| includeTags  | boolean | Dictates if tags will be removed                              |
| sort         | boolean | Dictates if the doujins will be sorted based on num_favorites |

## Methods

### convertTagNameToId

converts a tag from their name to their id

```ts
const wrapper = new NhentaiWrapper();
wrapper.convertTagNameToId("unbirth").then((data) => {
	console.log(data); // output is 9116
});
```

### fetchAllDoujins

fetches all the doujin given a tag or a term, limited to the doujinsLimit property

| Property | Type                            | Description                                                             |
| -------- | ------------------------------- | ----------------------------------------------------------------------- |
| query    | string                          | The query string to be used, must be compatible with the type parameter |
| type     | "term" or "tag"                 | The type of query to be done                                            |
| opts     | Partial\<Options\> or undefined | The options to be used                                                  |

returns: Promise\<QueryResponse\>

### fetchRelatedDoujins

fetches all the doujins related to a specific doujin, based on their id

| Property | Type                            | Description                                   |
| -------- | ------------------------------- | --------------------------------------------- |
| id       | number                          | the id of the doujin to base the results from |
| opts     | Partial\<Options\> or undefined | The options to be used                        |

returns: Promise\<RelatedDoujins\>

### getRandomDoujin

gets a single random doujin. This might take a while to resolve because it uses recursion

| Property | Type                            | Description            |
| -------- | ------------------------------- | ---------------------- |
| opts     | Partial\<Options\> or undefined | The options to be used |

returns: Promise\<Doujin\>

### searchDoujin

searches for a single doujin based on the id / "nuclear codes"

| Property | Type                            | Description                    |
| -------- | ------------------------------- | ------------------------------ |
| id       | number                          | the id of the doujin to search |
| opts     | Partial\<Options\> or undefined | The options to be used         |

returns: Promise\<Doujin | null\>

### searchTag

searches for a single page of doujins containing a certain tag

| Property | Type                            | Description            |
| -------- | ------------------------------- | ---------------------- |
| tag      | string                          | the id of the tag      |
| opts     | Partial\<Options\> or undefined | The options to be used |

returns: Promise\<QueryResponse\>

### searchTerm

searches for a single page of doujins containing a term in their title

| Property | Type                            | Description                    |
| -------- | ------------------------------- | ------------------------------ |
| term     | string                          | the term to be grepped against |
| opts     | Partial\<Options\> or undefined | The options to be used         |

returns: Promise\<QueryResponse\>

## Output Interfaces

These are typed nhentai API responses

### Doujin

Represents a single doujin

| Property      | Type               | Description                                                 |
| ------------- | ------------------ | ----------------------------------------------------------- |
| id            | number             | The nuclear codes                                           |
| media_id      | number             | Internal ID used by nhentai for pages / covers / thumbnails |
| title         | Title              | The titles of the doujin                                    |
| images        | Images             | The dimensions of the images associated with the doujin     |
| scanlator     | string             |                                                             |
| upload_date   | number             | UNIX Epoch Timestamp of doujin upload date                  |
| tags          | Tag[] or undefined | A list of the tags that the doujin has                      |
| num_pages     | number             | The number of pages that the doujin has                     |
| num_favorites | number             | The number of times that the doujin has been favorited      |

### RelatedDoujins

Represents a group of doujins

| Property | Type                           | Description                     |
| -------- | ------------------------------ | ------------------------------- |
| result   | Doujin[]                       | An array of doujins             |
| error    | string or boolean or undefined | Errors encountered by the query |

### QueryResponse extends RelatedDoujins

Represents a group of doujins with pagination information

| Property  | Type   | Description                                          |
| --------- | ------ | ---------------------------------------------------- |
| num_pages | number | The number of queries it takes to fetch all doujins  |
| per_page  | number | The number of doujins that will be fetched per query |

### TagType

A union type of all possibletag types that nhentai uses

Value: `"tag" | "language" | "artist" | "category" | "group" | "parody" | "character"`

### Tag

Represents a single tag

| Property | Type    | Description                            |
| -------- | ------- | -------------------------------------- |
| id       | number  | Internal tag id used by nhentai        |
| type     | TagType | The type of the tag                    |
| name     | string  | The name of the tag                    |
| url      | string  | The path of the tag without the domain |
| count    | number  | The number of doujins with this tag    |

### Image

Represents the dimensions of an image

| Property | Type   | Description                     |
| -------- | ------ | ------------------------------- |
| t        | string | The file extension of the image |
| w        | number | The width of the image          |
| h        | number | The height of the image         |

### Images

Represents the images of the doujin, such as cover, thumbnails, and pages

| Property  | Type                 | Description                                                      |
| --------- | -------------------- | ---------------------------------------------------------------- |
| pages     | Image[] or undefined | The pages of the doujin                                          |
| cover     | Image                | The cover of the doujin                                          |
| thumbnail | Image                | The thumbnail of the doujin (This is used in the doujin browser) |

### Title

Represents the different titles of the doujin

| Property | Type   |
| -------- | ------ |
| english  | string |
| japanese | string |
| pretty   | string |
