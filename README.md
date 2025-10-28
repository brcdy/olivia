# Terminal Portfolio

Ever wanted a portfolio that looks like you're hacking into the Matrix? Well, this is it. It's a simple, interactive terminal-style webpage that you can use to show off your projects and skills. No fancy frameworks, just some good ol' HTML, CSS, and JavaScript.

## What's the deal with this?

I wanted a portfolio that was a bit different from the usual. Something that reflects my love for the command line and has a bit of a retro vibe. So, I built this. It's got a few fun features:

*   **Interactive Terminal:** Type commands and get responses, just like a real terminal.
*   **ASCII Art:** Because what's a terminal without some cool ASCII art?
*   **Customizable Commands:** You can easily add your own commands to the `script.js` file.
*   **Image and Text Viewer:** Display your projects or whatever you want right in the terminal.
*   **Music Player:** A sleek, built-in music player to set the mood.

## How to use it

It's pretty straightforward. Just open up the `index.html` file in your browser and start typing. Here are the commands you can use:

*   `help` - Shows a list of available commands.
*   `ls` - Lists all the "files" (memories, in this case).
*   `view [filename]` - Displays an image or text file.
*   `play [filename]` - Plays an audio file.
*   `next` / `prev` - Navigate through the memories.
*   `clear` - Clears the terminal screen.
*   `exit` - A little surprise for you.

## Make it your own

This project is super easy to customize. Here's how:

1.  **Fork this repo.**
2.  **Change the content:** Open up `script.js` and look for the `memories` array. You can add your own images, text files, and audio files there. Just make sure to put your files in the `images` folder (or wherever you want, just update the path).
3.  **Tweak the look:** All the styles are in `style.css`. Go wild with the colors, fonts, and whatever else you want to change.
4.  **Add new commands:** In `script.js`, find the `processCommand` function. You can add new `case` statements to the `switch` block to create your own commands.

## Putting it on the web

This project is perfect for GitHub Pages. Just push your changes to the `main` branch of your forked repo, go to the "Pages" section in your repository settings, and enable it. Boom, your terminal portfolio is live.

## Credits

This project was inspired by a bunch of different terminal-style websites I've seen around the web. It's a fun way to make a portfolio that stands out.
