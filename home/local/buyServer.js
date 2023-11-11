/** @param {NS} ns */
import { updatePersonal } from "/scripts/gentargets.js"
export async function main(ns) {
	let MaxServers = ns.getPurchasedServerLimit();
	const ownedServers = ns.getPurchasedServers();
	let numServers = ownedServers.length;
	let spareSlots = MaxServers - numServers;
	ns.tprint(spareSlots, " slots remaining.");
	let cash = ns.getServerMoneyAvailable("home");
	let baseName = "node-";

	//Args
	let mode = ns.args[0];
	// -h help -c cost for ram -b buy -l list owned -x purge -u upgrade stack

	let ram = ns.args[1];
	// RAM in Gb default 8

	let n = ns.args[2];
	//number of servers default 1

	//Help Mode
	if (mode == "-h") {
		ns.tprint("Usage: server [mode] [ram] [number]");
		ns.tprint("server -h : displays this. -x purge");
		ns.tprint(" server -c X Y");
		ns.tprint("shows the cost of Y servers with X RAM each");
		ns.tprint("server -b X Y");
		ns.tprint("purchases Y servers with X RAM");
		ns.tprint("server -l prints a list of all owned servers");
		ns.tprint("server -x kills tasks and deletes all servers");
		ns.tprint("server -u X Y.");
		ns.tprint("combines -x and -b.");

	}

	// Costing Mode
	else if (mode == "-c") {
		let unitCost = ns.getPurchasedServerCost(ram);
		let totalCost = n * unitCost;
		ns.tprint("With ", ram, "Gb RAM, each server will cost ", unitCost, " for a total of ", totalCost);
	}

	//PURGE MODE
	else if (mode == "-x") {
		for (const host of ownedServers) {
			ns.killall(host);
			ns.deleteServer(host);
		}
		updatePersonal(ns);
		return;
	}

	//Buying Mode
	else if (mode == "-b") {
		let unitCost = ns.getPurchasedServerCost(ram);
		let totalCost = n * unitCost;
		if (n > spareSlots) {
			ns.tprint("Not enough server slots remaining");
			return;
		}
		else if (totalCost > cash) {
			ns.tprint("You're too broke.");
			return;
		}
		else {
			while (n > 0) {
				let j = 0
				let nextName = baseName + numServers;
				ns.purchaseServer(nextName, ram);
				n--;
				j++;
				ns.tprint("Bought ", j, " servers with ", ram, "RAM each.");

			}
			updatePersonal(ns);
			return;
		}
	}


	// List Owned Servers
	else if (mode == "-l") {
		ns.tprint(ownedServers);
		return;

	}
	else if (mode == "-u") {

		for (const host of ownedServers) {
			ns.killall(host);
			ns.deleteServer(host);
		}
		n = 25;
		let unitCost = ns.getPurchasedServerCost(ram);
		let totalCost = n * unitCost;
		spareSlots = 25;
		if (n > spareSlots) {
			ns.tprint("Not enough server slots remaining");
			return;
		}
		else if (totalCost > cash) {
			ns.tprint("You're too broke. You need $",totalCost);
			return;
		}
		else {
			while (n > 0) {
				let j = 0
				let nextName = baseName + numServers;
				ns.purchaseServer(nextName, ram);
				n--;
				j++;
				ns.tprint("Bought ", j, " servers with ", ram, "RAM each.");

			}
			updatePersonal(ns);
			return;



		}
	}
	//Fail
	else {
			ns.tprint("Please select a mode.");
			return;
		}
	}