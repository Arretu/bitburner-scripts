/** @param {NS} ns */
export async function nMap(ns) {

	ns.disableLog('scan')
	const pServers = ns.getPurchasedServers();
	const filterList = pServers.concat("home");
	let server = "home";
	const toScan = [];
	const allServers = [];

	let allScanned = false;

	while (allScanned == false) {

		if(filterList.indexOf(server) === -1 && server != undefined) {
			allServers.push(server);
			ns.print("Added ",server," to server list.")
		} else { ns.print(server, " was filtered from the list.")}

		let thisScan = ns.scan(server);
		for (const newserver of thisScan) {
			if (filterList.indexOf(newserver) === -1) {
				if (allServers.indexOf(newserver) === -1) {
					if (toScan.indexOf(newserver) === -1) {
						toScan.push(newserver)
					}
				}
			}
		}
		if (toScan.length > 0) {
			server = toScan.pop();
		}
		else {
			allScanned = true;
		}
	}
	ns.tprint("Found ",allServers.length," servers.")
	ns.write("/data/static/npcHosts.txt",allServers.toString(),"w");
	return allServers;
}