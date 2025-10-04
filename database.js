// DATABASE CONTROLLER 
import Dexie from "https://cdn.jsdelivr.net/npm/dexie@4.0.8/dist/dexie.mjs";
import { v4 as uuidv4 } from "https://cdn.skypack.dev/uuid";
export class DATABASE {
    constructor() {
        this.db = new Dexie('ACCOUNTS');
        this.db.version(1).stores({
            LedgerGroup: 'name , created, color',
            Ledger: 'name, total, latest_entrie_amount, latest_entrie_time, latest_entrie_from_ledger, latest_entrie_to_ledger, groupName, color, icon',
            Entrie: 'id, amount, from_ledger, to_ledger, created_on, description, image'
        });
    }

    async initDB() {
        try {
            await this.db.open();
            await this.LedgerGroup.createDefault();
            await this.Ledger.createDefault();
            // console.log(await this.db.LedgerGroup.);
            return 'Database loaded';
        } catch (error) {
            throw new Error(`Database initialization failed: ${error.message}`);
        }
    }

    get LedgerGroup() {
        return {
            add: async (newGroup) => {
                return await this._LedgerGroupsAdd(newGroup);
            },
            edit: async (name, group) => {
                return await this._LedgerGroupEdit(name, group);
            },
            delete: async (name) => {
                return await this._LedgerGroupsDelete(name);
            },
            list: async () => {
                return await this._LedgerGroupsGetAll();
            },
            createDefault: async () => {
                return await this._LedgerGroupCreateDefault();
            },
            getLedgers: async (name) => {
                return await this._getLedgersByGroupName(name);
            },
        };
    }



    // LEDGER GROUP OPERATIONS -------------------------------------------->
    // LEDGER GROUP OPERATIONS -------------------------------------------->
    // LEDGER GROUP OPERATIONS -------------------------------------------->
    // LEDGER GROUP OPERATIONS -------------------------------------------->
    // LEDGER GROUP OPERATIONS -------------------------------------------->
    // LEDGER GROUP OPERATIONS -------------------------------------------->
    // LEDGER GROUP OPERATIONS -------------------------------------------->
    async _LedgerGroupsAdd(newGroup) {
        newGroup.name = newGroup.name.trim().toLowerCase();
        console.log("inside ledger group add")
        const existing = await this.db.LedgerGroup.where('name').equals(newGroup.name).first();
        if (existing) {
            throw new Error(`Ledger group with name '${newGroup.name}' already exists`);
        }

        console.log("group does not exists ")
        newGroup = { ...newGroup, created: new Date() } // adding created date

        const key = await this.db.LedgerGroup.add(newGroup);

        return true;
    }

    async _LedgerGroupEdit(name, group) {
        name = name.trim().toLowerCase();
        group.name = group.name.trim().toLowerCase();

        // check if group exists 
        const existingGroup = await this.db.LedgerGroup.get(name);
        if (!existingGroup) throw new Error(`Ledger group with name ${name} does not exist`);

        // checking for new name's alerady existence 
        const existing = await this.db.LedgerGroup.where('name').equals(group.name).first();
        if (existing && group.name !== name) {
            throw new Error(`Ledger group with name '${group.name}' already exists`);
        }

        // dexie cannot change a primary key in-place, so we need to:
        let updatedLedgerGroup = { ...group, created: existingGroup.created }; // ensuring created date remains same


        // use a read/write transaction on both tables
        await this.db.transaction('rw', this.db.LedgerGroup, this.db.Ledger, async (tx) => {

            // tables 
            const LedgerGroup = tx.table(this.db.LedgerGroup.name);
            // name conatins the old name - if it is not chnaging then we can simply update the group
            // if it is changing then we need to delete the old group and create a new one with new name
            console.log("updating group :", name, "to", updatedLedgerGroup)
            if (group.name == name) {
                console.log("just updating group with updated fields other than name")

                await LedgerGroup.update(name, group);
            } else {
                console.log("updating group with name change")
                // deleteing group with old name
                await LedgerGroup.delete(name);

                // recreated same group with new name and other updated fields
                await LedgerGroup.add(updatedLedgerGroup) // creating new with prevoius value other than name
                console.log(updatedLedgerGroup)



            }

            // updating all related ledgers with new group name
            await this._updateGroupNameOnGroupEditAndDelete(name, updatedLedgerGroup, tx); //tryna rename groupname in Ledgers

            console.log("updated group name from LedgerGroup and all related ledger")

            return updatedLedgerGroup;
        });


        await this.db.Ledger.delete(name);

    }

    async _LedgerGroupsDelete(name) {
        try {
            name = name.trim().toLowerCase();
            const group = await this.db.LedgerGroup.get(name);
            if (!group) throw new Error(`Ledger group with name ${name} does not exist`);


            await this.db.transaction("rw", this.db.LedgerGroup, this.db.Ledger, async (tx) => {
                const LedgerGroup = tx.table(this.db.LedgerGroup.name);
                console.log("deleting group :", name, "in backend")
                await LedgerGroup.delete(name); // deleting group 
                console.log("deleted group : ", name)
                await this._updateGroupNameOnGroupEditAndDelete(name, "", tx); //tryna rename groupname in Ledgers

            })

            console.log("Deleted LedgerGroup and Renamed Ledger's groupName property to empty ")
            return true;
        } catch (error) {
            throw new Error(`${error.message}`)
        }
    }

    async _LedgerGroupsGetAll() {
        return await this.db.LedgerGroup.orderBy('name').toArray();
    }



    async _LedgerGroupCreateDefault() {
        const count = await this.db.LedgerGroup.count();
        if (count > 0) {
            return false; // Already initialized
        }

        const defaultGroups = [
            { name: "assets", color: "green" },
            { name: "liabilities", color: "red" },
            { name: "income", color: "blue" },
            { name: "expense", color: "#e1e12b" },
            { name: "cash", color: "purple" },
            { name: "investment", color: "orange" },
            { name: "general", color: "gray" }
        ];

        await this.db.LedgerGroup.bulkAdd(
            defaultGroups.map(group => ({
                created: new Date(),
                ...group
            }))
        );

        return true;
    }


    //   gets ldger based on groupname
    async _getLedgersByGroupName(name) {
        if (!name) return [];

        name = name.trim().toLowerCase();
        console.log("fetching ledgers for group name:", name)
        // groupName === name
        return await this.db.Ledger.where("groupName").equals(name).toArray();
    }

    // getter for accessing the legder related functions
    // getter for accessing the legder related functions
    // getter for accessing the legder related functions
    // getter for accessing the legder related functions
    // getter for accessing the legder related functions
    get Ledger() {
        return {
            add: async (newLedger) => this._LedgerAdd(newLedger),
            edit: async (name, newName) => this._LedgerEdit(name, newName),
            delete: async (name) => this._LedgerDelete(name),
            list: async () => this._LedgerGetAll(),
            createDefault: async () => this._LedgerCreateDefault(),

        };
    }






    // LEDGER OPERATIONS --------------------------------------------------____>
    // LEDGER OPERATIONS --------------------------------------------------____>
    // LEDGER OPERATIONS --------------------------------------------------____>
    // LEDGER OPERATIONS --------------------------------------------------____>
    // LEDGER OPERATIONS --------------------------------------------------____>
    // LEDGER OPERATIONS --------------------------------------------------____>
    // LEDGER OPERATIONS --------------------------------------------------____>
    // LEDGER OPERATIONS --------------------------------------------------____>
    // LEDGER OPERATIONS --------------------------------------------------____>
    // LEDGER OPERATIONS --------------------------------------------------____>
    async _LedgerAdd(ledger) {
        // converting to lower case and trimming spaces and replacing space between word with underscores
        ledger.name = ledger.name ? ledger.name.trim().toLowerCase() : "";
        ledger.groupName = ledger.groupName ? ledger.groupName.trim().toLowerCase() : "";
        try {
            if (!ledger.name) {
                throw new Error("cannot create a ledger without name");
            }

            // Check if ledger already exists
            const existing = await this.db.Ledger.where('name').equals(ledger.name).first();
            if (existing) {
                throw new Error(`Ledger with name '${ledger.name}' already exists`);
            }

            // adding color to ledger from group if groupName is provided
            if (ledger.groupName) {
                const groupExists = await this.db.LedgerGroup.where('name').equals(ledger.groupName).first();
                if (!groupExists) {
                    throw new Error(`Ledger group with name '${ledger.groupName}' does not exist`);
                }

                ledger.color = groupExists.color;
            }


            const key = await this.db.Ledger.add(ledger);
            const addedLedger = await this.db.Ledger.get(key);
            console.log("Ledger created:", addedLedger);
            return true;
        } catch (error) {
            throw new Error(`Failed to add ledger: ${error.message}`);
        }
    }


    // ledger edit
    async _LedgerEdit(oldName, newLedgerData) {
        oldName = oldName.trim().toLowerCase();
        if (newLedgerData.name) {
            newLedgerData.name = newLedgerData.name.trim().toLowerCase();
        }
        if (newLedgerData.groupName) {
            newLedgerData.groupName = newLedgerData.groupName.trim().toLowerCase();
        }

        console.log("inside ledger edit", oldName, newLedgerData)
        // existing ledger
        const ledger = await this.db.Ledger.get(oldName);
        if (JSON.parse(JSON.stringify(ledger)) == JSON.parse(JSON.stringify(newLedgerData))) throw new Error("No Change Detected"); // if nothing is changed
        if (!ledger) {
            throw new Error(`Ledger with name '${oldName}' does not exist`);
        }

        // if user is changing the name, check if new name already exists
        if (newLedgerData.name && newLedgerData.name !== oldName) {
            const existing = await this.db.Ledger.get(newLedgerData.name);
            if (existing) {
                throw new Error(`Ledger with name '${newLedgerData.name}' already exists`);
            }
        }

        // Dexie cannot change a primary key in-place, so we need to:
        // 1. Delete the old record
        // 2. Add a new one with the new name (and keep other fields)
        const updatedLedger = { ...ledger, ...newLedgerData };

        if (newLedgerData.groupName) {
            const groupExists = await this.db.LedgerGroup.where('name').equals(newLedgerData.groupName).first();
            if (!groupExists) {
                throw new Error(`Ledger group with name '${newLedgerData.groupName}' does not exist`);
            }

            updatedLedger.color = groupExists.color;
        }



        await this.db.transaction('rw', this.db.Ledger, this.db.Entrie, async (tx) => {

            const Ledger = tx.table(this.db.Ledger.name);
            if (newLedgerData.name && newLedgerData.name !== oldName) {
                console.log("updating ledger with name change")
                // Remove old record if name is changing

                await Ledger.delete(oldName);
                await Ledger.add(updatedLedger);

                // Update all related entries in Entrie table
                await this._updateLedgerInAllEntries(oldName, updatedLedger.name, tx);
                // console.log("Updated Ledger name and all related entries");



            } else {
                // Name didn't change, just update other fields
                console.log("just updating ledger without name change")
                await Ledger.update(oldName, updatedLedger);
            }
        });

        return updatedLedger;
    }


    // query used to be woring with transaction
    // for assuming that this will only be called after update in ledger 
    async _updateLedgerInAllEntries(oldLedgerName, newLedgerName, tx) {

        const Entrie = tx ? tx.table(this.db.Entrie.name) : this.db.Entrie;

        // Get all entries where from_ledger matches
        const fromEntries = await Entrie
            .where('from_ledger')
            .equals(oldLedgerName)
            .toArray();

        // Get all entries where to_ledger matches
        const toEntries = await Entrie
            .where('to_ledger')
            .equals(oldLedgerName)
            .toArray();

        if (toEntries.length === 0 && fromEntries.length === 0) {
            console.log("No entries to update for ledger name change");
            return;
        }

        console.log(`Found ${fromEntries.length} from_ledger and ${toEntries.length} to_ledger entries to update.`);

        // Update from_ledger matches
        await Promise.all(
            fromEntries.map(entry =>
                Entrie.update(entry.id, { from_ledger: newLedgerName })
            )
        );

        // Update to_ledger matches
        await Promise.all(
            toEntries.map(entry =>
                Entrie.update(entry.id, { to_ledger: newLedgerName })
            )
        );

        console.log(
            `Updated ${fromEntries.length} from_ledger and ${toEntries.length} to_ledger entries.`
        );
    }




    // delete ledger
    async _LedgerDelete(name) {
        try {
            name = name.trim().toLowerCase();
            console.log(name)

            // Check if ledger exists
            const ledger = await this.db.Ledger.get(name);
            if (!ledger) throw new Error(`Ledger with name ${name} does not exist`);

            // Check if any entries are associated with this ledger
            const associatedEntries = await this.db.Entrie
                .where('from_ledger')
                .equals(name)
                .or('to_ledger')
                .equals(name)
                .count();

            if (associatedEntries > 0) {
                throw new Error(`Cannot delete ledger '${name}' because it has associated entries.`);
            }

            // to delete
            console.log("deleting ledger :", name, "in backend")

            await this.db.Ledger.delete(name);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete Ledger : ${error.message}`)
        }
    }


    // get all ledgers
    async _LedgerGetAll() {
        let allLedgers = await this.db.Ledger.toArray();

        let sortedLedgers = allLedgers.sort((a, b) => {
            let timeA = a.latest_entrie_time ? new Date(a.latest_entrie_time) : 0;
            let timeB = b.latest_entrie_time ? new Date(b.latest_entrie_time) : 0;
            return timeB - timeA; // descending
        });
        console.log("sorted ledgers :", sortedLedgers)
        sortedLedgers.forEach(l => {
            console.log(l.latest_entrie_time, "from_ledger :" + l.latest_entrie_from_ledger, "to_ledger :" + l.latest_entrie_to_ledger)
        })

        return sortedLedgers;
    }

    async _LedgerCreateDefault() {
        const count = await this.db.Ledger.count();
        if (count > 0) {
            return false; // Already initialized
        }

        const defaultLedgers = [
            { name: "cash", groupName: "cash", total: 0, color: "purple", icon: "fa-solid fa-money-bill" },
            { name: "bank", groupName: "assets", total: 0, color: "green", icon: "fa-solid fa-bank" },
            { name: "credit card", groupName: "liabilities", total: 0, color: "red", icon: "fa-solid fa-credit-card" },
            { name: "salary", groupName: "income", total: 0, color: "blue", icon: "fa-solid fa-money-bill-wave" },
            { name: "groceries", groupName: "expense", total: 0, color: "#e1e12b", icon: "fa-solid fa-cart-shopping" },
            { name: "rent", groupName: "expense", total: 0, color: "#e1e12b", icon: "fa-solid fa-house" },
            { name: "utilities", groupName: "expense", total: 0, color: "#e1e12b", icon: "fa-solid fa-lightbulb" },
            { name: "investments", groupName: "investment", total: 0, color: "orange", icon: "fa-solid fa-chart-line" },
            { name: "miscellaneous", groupName: "general", total: 0, color: "gray", icon: "fa-solid fa-folder" },
        ];

        await this.db.Ledger.bulkAdd(defaultLedgers);

        return true;
    }


    // this has to be used in transaction
    // after creating entry ,calling this function to updated the latest entrie fields in related ledgers
    async _updateLatestEntryInLedger(from_ledger, to_ledger, entry, tx = null, isUpdatingTotalOnly = false, isDeleting = false) {
        const Entrie = tx ? tx.table(this.db.Entrie.name) : this.db.Entrie;
        const Ledger = tx ? tx.table(this.db.Ledger.name) : this.db.Ledger;
        let toTotal = 0;
        let fromTotal = 0;

        // if entry is being deleted then we need to handle the case when there are no entries left in the ledger
        if (isDeleting) {
            // for from_ledger
            const fromLedgerEntries = await Entrie
                .filter(e => e.from_ledger === from_ledger || e.to_ledger === from_ledger)
                .toArray();

            if (fromLedgerEntries.length === 0) {
                // no entries left in this ledger
                await Ledger.update(from_ledger, {
                    total: 0,
                    latest_entrie_amount: "",
                    latest_entrie_time: "",
                    latest_entrie_from_ledger: "",
                    latest_entrie_to_ledger: "",
                });
            } else {
                // recalculate total and latest entry details
                fromTotal = fromLedgerEntries.reduce((sum, e) => {
                    if (e.from_ledger !== from_ledger) {
                        sum -= Number(e.amount);
                        return sum;
                    }
                    sum += Number(e.amount);
                    return sum;
                }, 0);
                const latestEntry = fromLedgerEntries.reduce((latest, e) =>
                    !latest || new Date(e.created_on) > new Date(latest.created_on) ? e : latest
                    , null);

                await Ledger.update(from_ledger, {
                    total: fromTotal,
                    latest_entrie_amount: latestEntry.amount,
                    latest_entrie_time: latestEntry.created_on,
                    latest_entrie_from_ledger: latestEntry.from_ledger,
                    latest_entrie_to_ledger: latestEntry.to_ledger,
                });
            }

            // for to_ledger
            if (to_ledger) {
                const toLedgerEntries = await Entrie
                    .filter(e => e.from_ledger === to_ledger || e.to_ledger === to_ledger)
                    .toArray();

                if (toLedgerEntries.length === 0) {
                    // no entries left in this ledger
                    await Ledger.update(to_ledger, {
                        total: 0,
                        latest_entrie_amount: "",
                        latest_entrie_time: "",
                        latest_entrie_from_ledger: "",
                        latest_entrie_to_ledger: "",
                    });
                } else {
                    // recalculate total and latest entry details
                    toTotal = toLedgerEntries.reduce((sum, e) => {
                        if (e.from_ledger !== to_ledger) {
                            sum -= Number(e.amount);
                            return sum;
                        }
                        sum += Number(e.amount);
                        return sum;
                    }, 0);
                    const latestEntry = toLedgerEntries.reduce((latest, e) =>
                        !latest || new Date(e.created_on) > new Date(latest.created_on) ? e : latest
                        , null);

                    await Ledger.update(to_ledger, {
                        total: toTotal,
                        latest_entrie_amount: latestEntry.amount,
                        latest_entrie_time: latestEntry.created_on,
                        latest_entrie_from_ledger: latestEntry.from_ledger,
                        latest_entrie_to_ledger: latestEntry.to_ledger,
                    });
                }
            }

            console.log(`Totals recalculated after deletion: ${from_ledger}=${fromTotal}, ${to_ledger}=${to_ledger ? toTotal : 0}`);
            return;
        }





        // updating in from ledger
        if (from_ledger) {
            const fromLedgerEntries = await Entrie
                .filter(e => e.from_ledger === from_ledger || e.to_ledger === from_ledger)
                .toArray();

            // getting the latest one
            let latestEntrie = fromLedgerEntries.reduce((latest, e) => {
                // If no "latest"
                if (!latest) return e;
                // getting lates dates 
                return new Date(e.created_on) > new Date(latest.created_on) ? e : latest;
            }, null);

            // here i am sying that this is the latets entrie please update the latest entries fields a swell
            let isOnlyTotalUpdating = true;
            if (latestEntrie.id == entry.id) {
                isOnlyTotalUpdating = false
            }



            fromTotal = fromLedgerEntries.reduce((sum, e) => {
                if (e.from_ledger !== from_ledger) {
                    sum -= Number(e.amount);
                    return sum;
                }
                sum += Number(e.amount);
                return sum;
            }, 0);
            await Ledger.update(from_ledger, (isUpdatingTotalOnly && isOnlyTotalUpdating) ? { total: fromTotal } : {
                total: fromTotal,
                latest_entrie_amount: latestEntrie ? latestEntrie.amount : entry.amount,
                latest_entrie_time: latestEntrie ? latestEntrie.created_on : entry.created_on,
                latest_entrie_from_ledger: latestEntrie ? latestEntrie.from_ledger : entry.from_ledger,
                latest_entrie_to_ledger: latestEntrie ? latestEntrie.to_ledger : entry.to_ledger,
            });
        }

        // updating in to ledger
        if (to_ledger) {
            const toLedgerEntries = await Entrie
                .filter(e => e.from_ledger === to_ledger || e.to_ledger === to_ledger)
                .toArray();


            // getting the latest one
            let latestEntrie = toLedgerEntries.reduce((latest, e) => {
                // If no "latest"
                if (!latest) return e;
                // getting lates dates 
                return new Date(e.created_on) > new Date(latest.created_on) ? e : latest;
            }, null);

            // here i am sying that this is the latets entrie please update the latest entries fields a swell
            let isOnlyTotalUpdating = true;
            if (latestEntrie.id == entry.id) {
                isOnlyTotalUpdating = false
            }



            toTotal = toLedgerEntries.reduce((sum, e) => {
                if (e.from_ledger !== to_ledger) {
                    sum -= Number(e.amount);
                    return sum;
                }
                sum += Number(e.amount);
                return sum;
            }, 0);
            await Ledger.update(to_ledger, (isUpdatingTotalOnly && isOnlyTotalUpdating) ? { total: toTotal } : {
                total: toTotal,
                latest_entrie_amount: latestEntrie ? latestEntrie.amount : entry.amount,
                latest_entrie_time: latestEntrie ? latestEntrie.created_on : entry.created_on,
                latest_entrie_from_ledger: latestEntrie ? latestEntrie.from_ledger : entry.from_ledger,
                latest_entrie_to_ledger: latestEntrie ? latestEntrie.to_ledger : entry.to_ledger,

            });
        }

        console.log(`Totals recalculated: ${from_ledger}=${fromTotal}, ${to_ledger}=${to_ledger ? toTotal : "N/A"}`);

    }


    // asuming this will be called after updated in LedgerGroup
    async _updateGroupNameOnGroupEditAndDelete(oldGroupName, newGroup = "", tx = null) {

        // newGroupName can be empty so that i can use this same function while deleteing the group as well

        const Ledger = tx ? tx.table(this.db.Ledger.name) : this.db.Ledger;

        let allRelatedLedgers = await Ledger.filter(l => l.groupName === oldGroupName).toArray();

        await allRelatedLedgers.forEach(async (ledger) => {
            await Ledger.update(ledger.name, { groupName: newGroup.name, color: newGroup.color || "" })
        });
        console.log("done with renaming ledger group name")

        // checks
        // let exists = this.db.group
    }








    // getter for accessing the Entrie related functions
    // getter for accessing the Entrie related functions
    // getter for accessing the Entrie related functions
    // getter for accessing the Entrie related functions
    // getter for accessing the Entrie related functions
    get Entrie() {
        return {
            add: async (newEntrie) => this._EntrieAdd(newEntrie),
            edit: async (entryId, updatedEntry) => this._EntrieEdit(entryId, updatedEntry),
            delete: async (name) => this._EntrieDelete(name),
            list: async (ledgerName) => this._EntrieGetAll(ledgerName)
        };
    }






    // Entrie OPERATIONS --------------------------------------------------____>
    // Entrie OPERATIONS --------------------------------------------------____>
    // Entrie OPERATIONS --------------------------------------------------____>
    // Entrie OPERATIONS --------------------------------------------------____>
    // Entrie OPERATIONS --------------------------------------------------____>
    // Entrie OPERATIONS --------------------------------------------------____>
    // Entrie OPERATIONS --------------------------------------------------____>
    // Entrie OPERATIONS --------------------------------------------------____>
    // Entrie OPERATIONS --------------------------------------------------____>
    // Entrie OPERATIONS --------------------------------------------------____>

    async _EntrieAdd(newEntrie) {

        newEntrie.from_ledger = newEntrie.from_ledger ? newEntrie.from_ledger.trim().toLowerCase() : "";
        newEntrie.to_ledger = newEntrie.to_ledger ? newEntrie.to_ledger.trim().toLowerCase() : "";

        console.log("inside newEntrie add");

        // validate fields
        if (!newEntrie.from_ledger || !newEntrie.to_ledger) {
            throw new Error("newEntrie must have both from_ledger and to_ledger");
        }


        if (!newEntrie.amount || newEntrie.amount <= 0) {
            throw new Error("newEntrie must have a valid amount");
        }

        // checking existence
        const existingFrom_ledger = await this.db.Ledger.get(newEntrie.from_ledger);
        if (!existingFrom_ledger) {
            throw new Error(`Ledger with name '${newEntrie.from_ledger}' does not exist`);
        }
        // checking existence
        const existingTo_ledger = await this.db.Ledger.get(newEntrie.to_ledger);
        if (!existingTo_ledger) {
            // create the ledger if it does not exist
            await this.db.Ledger.add({ name: newEntrie.to_ledger });
        }



        newEntrie.id = uuidv4();
        newEntrie.created_on = newEntrie.created_on || new Date();

        // use a read/write transaction on both tables
        await this.db.transaction('rw', this.db.Entrie, this.db.Ledger, async (tx) => {

            // tables 
            const Entrie = tx.table(this.db.Entrie.name);
            // Add the entry
            await Entrie.add(newEntrie);

            // Recalculate total inside the same transaction
            await this._updateLatestEntryInLedger(newEntrie.from_ledger, newEntrie.to_ledger, newEntrie, tx);

        });



        console.log("newEntrie created and total updated successfully");
    }



    // update entry




    async _EntrieEdit(id, updatedEntry) {
        updatedEntry.from_ledger = updatedEntry.from_ledger ? updatedEntry.from_ledger.trim().toLowerCase() : "";
        updatedEntry.to_ledger = updatedEntry.to_ledger ? updatedEntry.to_ledger.trim().toLowerCase() : "";
        // Fetch the existing entry by ID
        const existingEntry = await this.db.Entrie.get(id);
        if (!existingEntry) {
            throw new Error(`Entry with id '${id}' does not exist`);
        }

        // Merge the existing entry with updated fields
        const updated = { ...existingEntry, ...updatedEntry };
        if (JSON.parse(JSON.stringify(existingEntry)) == JSON.parse(JSON.stringify(updated))) throw new Error("No Change Detected"); // if nothing is changed

        // Update in DB
        console.log("existing entry:", existingEntry);
        console.log("entry sent to update:", updatedEntry)
        console.log("updating entry:", updated)

        await this.db.transaction('rw', this.db.Entrie, this.db.Ledger, async (tx) => {

            const Entrie = tx.table(this.db.Entrie.name);

            await Entrie.update(id, updated); // update the entry


            // Recalculate totals in both related ledgers
            await this._updateLatestEntryInLedger(updated.from_ledger, updated.to_ledger, updated, tx, true); // true indicates only total needs to be updated
        });

        console.log("updating entry from this ledger:", updated)

        return true;
    }


    async _EntrieDelete(id) {
        // Check 
        const existingEntry = await this.db.Entrie.get(id);
        if (!existingEntry) {
            throw new Error(`Entry with id '${id}' does not exist`);
        }

        // Delete by id key
        this.db.transaction('rw', this.db.Entrie, this.db.Ledger, async (tx) => {

            const Entrie = tx.table(this.db.Entrie.name);

            await Entrie.delete(id); // delete the entry

            // Recalculate totals in both related ledgers
            // false indicates only all fields needs to be updated
            // second true flag indicates that this time entry is being deleted
            await this._updateLatestEntryInLedger(existingEntry.from_ledger, existingEntry.to_ledger, existingEntry, tx, false, true);
        });

        console.log("entry deleted and totals updated in related ledgers")




        return true;
    }


    async _EntrieGetAll(ledgerName) {

        ledgerName = ledgerName ? ledgerName.trim().toLowerCase() : "";

        // Get entries where this ledger is the source
        const fromEntries = await this.db.Entrie
            .where("from_ledger")
            .equals(ledgerName)
            .toArray();

        // Get entries where this ledger is the destination
        const toEntries = await this.db.Entrie
            .where("to_ledger")
            .equals(ledgerName)
            .toArray();

        // Merge and sort by created_on ascending
        const results = [...fromEntries, ...toEntries]
            .sort((a, b) => new Date(a.created_on) - new Date(b.created_on));

        return results;
    }





}

