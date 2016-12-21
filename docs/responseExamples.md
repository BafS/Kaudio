##Notes
If a field does not contain any information (e.g. the playlist does not have any tracks) that field with not be included in the response body.
##GET /users/id
```
{
  "friends": [
    {
      "_id": "58599a98be3bae103cfa3a48",
      "email": "alice@user.com"
    },
    {
      "_id": "58599a99be3bae103cfa3a4a",
      "email": "charlie@user.com"
    }
  ],
  "_id": "58599a99be3bae103cfa3a49",
  "email": "bob@user.com"
}
```

##GET /tracks/id
```
{
  "album": {
    "artist": {
      "_id": "5859ab018ac48d1f28df1146",
      "name": "The Crazy Artist"
    },
    "_id": "5859ab018ac48d1f28df1147",
    "title": "New Album"
  },
  "_id": "5859ab018ac48d1f28df1148",
  "title": "The Song",
  "file": "5859ab008ac48d1f28df113c"
}
```

##GET /playlists/id
```
{
  "tracks": [
    {
      "_id": "58599a9bbe3bae103cfa3a52",
      "title": "Ba"
    },
    {
      "_id": "58599a9cbe3bae103cfa3a55",
      "title": "First Fires"
    },
    {
      "_id": "58599a9cbe3bae103cfa3a57",
      "title": "Prelude"
    }
  ],
  "user": {
    "_id": "58599a98be3bae103cfa3a48",
    "email": "alice@user.com"
  },
  "_id": "58599a9cbe3bae103cfa3a59",
  "name": "My first playlist",
  "public": true
}
```

##GET /artists/id
```
{
  "albums": [
    {
      "_id": "5859ab018ac48d1f28df1147",
      "title": "New album"
    }
  ],
  "_id": "5859ab018ac48d1f28df1146",
  "name": "The Crazy Artist"
}
```

##GET /albums/id
```
{
  "tracks": [
    {
      "_id": "5859ab018ac48d1f28df1148",
      "title": "The Song"
    }
  ],
  "artist": {
    "_id": "5859ab018ac48d1f28df1146",
    "name": "The Crazy Artist"
  },
  "_id": "5859ab018ac48d1f28df1147",
  "title": "New Album"
}
```