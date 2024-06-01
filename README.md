# UCSD CSE 125 2024 group 1: TBD studios

This is our group's 3D multiplayer video game for [CSE 125](https://cse125.ucsd.edu/). Our team opted to use WebGL to allow the game to run on more devices.

The game is currently deployed live at **[cse125.ucsd.edu:2345](http://cse125.ucsd.edu:2345/)**. There's also a local preview on [GitHub Pages](https://ucsd-cse125-sp24.github.io/group1/), but it does not support multiplayer.

## Development

This project requires [Node](https://nodejs.org/). This should also install [npm](https://www.npmjs.com/). Then, install the dependencies.

```shell
$ npm install
```

If you intend on making changes to both the server and the client, run the following command and open http://localhost:2345/ in your browser.

```shell
$ npm run watch
Listening on http://localhost:2345/
```

This will wait for changes you make to the code and re-build the project. If you edit any server code, it will also restart the server.

If you aren't working on the server and just want to have the server running, then run the following commands:

```shell
$ npm run build
$ npm start
Listening on http://localhost:2345/
```

We recommend installing the [Prettier VS Code extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and auto-formatting the file when you save. Alternatively, you can run the following command, which will try to format all the files in the repo. This way, our code will look consistent, and people with auto-formatting on won't have stray formatting changes in their commits.

```shell
$ npm run format
```

### Graphics

For front-end development where you will only be making changes to the client, you can just run the server normally.

```shell
$ npm run build
$ npm start
Listening on http://localhost:2345/
```

Then, in another terminal tab, run the following command and open http://127.0.0.1:8000/?ws=ws://localhost:2345/ in your browser.

```shell
$ npm run dev
 > Local:   http://127.0.0.1:8000/
```

This starts another server that will automatically re-build the project when you make a change.

The benefit of using `npm run dev` over `npm run watch` is that the former will wait for the project to finish building before loading the page, while with the latter, you might reload the page before building finishes, so you have to reload the page multiple times to see your changes. Nonetheless, if `npm run watch` works for you, you don't need to do this.

### Testing

If you run

```shell
$ npm test
```

It will say

```
Error: no test specified
```

This is because we didn't write any tests.
