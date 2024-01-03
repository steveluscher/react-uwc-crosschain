import { watch } from "fs";
import { build } from "./build";

build();

const watcher = watch(
  import.meta.dir + "/src",
  { recursive: true },
  (event, filename) => {
    console.log(`Detected ${event} in ${filename}`);
    build();
  }
);

process.on("SIGINT", () => {
  // close watcher when Ctrl-C is pressed
  console.log("Closing watcher...");
  watcher.close();

  process.exit(0);
});
