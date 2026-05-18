async function getPlaylistVideos(playlistId) {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    try {
        const res = await fetch(url);
        const html = await res.text();
        const match = html.match(/var ytInitialData = (\{.*?\});/);
        if (!match) return [];
        const data = JSON.parse(match[1]);
        const videos = [];
        const tabs = data.contents.twoColumnBrowseResultsRenderer.tabs;
        const playlistContents = tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
        for (const item of playlistContents) {
            if (item.playlistVideoRenderer) {
                videos.push({
                    videoId: item.playlistVideoRenderer.videoId,
                    title: item.playlistVideoRenderer.title.runs[0].text
                });
            }
        }
        return videos;
    } catch (e) {
        console.error('Error parsing', playlistId, e);
        return [];
    }
}

async function main() {
    const pids = ['PLT3bOBUU3L9gUQNXoRtPX-wW9QXq31c4r', 'PLT3bOBUU3L9jJXGSFC_BQczz7nZpmcjO6', 'PLXwFEditlQJ0nmRRQY7FDRvIWSNQZBptJ'];
    for (const pid of pids) {
        console.log(`--- Playlist: ${pid} ---`);
        const videos = await getPlaylistVideos(pid);
        for (const v of videos) {
            console.log(`${v.videoId} | ${v.title}`);
        }
    }
}
main();
