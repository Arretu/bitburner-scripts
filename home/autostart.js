/*
* Autostart. Run this after aug install to get going.
* Not sure why I put so many sleeps in?
* 
*/

/** @param {NS} ns */
export async function main(ns) {

	let home = 'home';
	ns.killall(home);

	//Delete Data Directory

	const dataDir = ns.ls(home, "data/");
	ns.tprint("Preparing to delete", dataDir.toString());
	canDelete = await ns.prompt("Delete listed files?");

	if (canDelete == true) {
		for (const file of dataDir) {
			ns.rm(file);
		}
			ns.tprint("Data directory wiped, reparing to generate new static data.");
	} 
	else {
		ns.tprint("Did not delete files. This may cause errors.")
		}


	await ns.sleep(5000);


	//Generate /data/static/allservers.txt
	ns.exec('/scripts/local/spider.js', home);

	await ns.sleep(5000);
	ns.tprint("All remote servers identified. Parsing data to new lists.")

	//Generates allnpc.txt, alltargets.txt, 
	ns.exec("/scripts/local/parseServers.js", 'home');

	await ns.sleep(5000);
	ns.tprint("Static files generated. Initialising daemons.");

	//Start parseDaemon to generate non-static lists. Pause to allow a cycle.
	ns.exec("/daemons/parseDaemon.js", 'home');
	await ns.sleep(5000);
	ns.tprint("parseDaemon running. Preparing rootDaemon.");

	//Start rootDaemon to nuke initial hosts.
	ns.exec("/daemons/rootDaemon.js", home);
	await ns.sleep(5000);
	ns.tprint("rootDaemon running.");


	// Start earlygame deployerDaemon.
	ns.tprint("Starting deployerDaemon")
	ns.exec("/daemons/deployDaemon.js", home);
	
	//And gracefully close.
	ns.tprint("Script Succesfully finished. Exiting");
	return;
}
