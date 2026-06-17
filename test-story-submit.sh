#!/bin/bash

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "contributor_id": "test-contributor-123",
    "city_id": "oakland",
    "title": "Test Story Submission",
    "content": "This is a test story submitted via curl."
  }' \
https://verbose-carnival-r4qjpj4q6pp52wpgj-3000.app.github.dev/api/contributor/story/submit/
