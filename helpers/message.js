function validateID(idString) {
  // Check if the string matches the pattern:
  // ^    -> Start of the string
  // \d{17,20} -> Exactly 17 to 20 digits
  // $    -> End of the string
  const regex = /^\d{17,20}$/;
  return regex.test(idString);
}

/**
 * Get arguments passed to a command
 * @param {string} message
 */
function getArgs(message) {
  const result = {
    string: [],
    number: [],
    boolean: [],
    user: [],
    channel: [],
    __: [],
  };

  const args = message.split(" ").slice(1);

  for (const [index, arg] of args.entries()) {
    const clean = arg.split("(");
    const type = clean[0];
    const value = clean[1].replace(")", "");

    result.__.push({ index, type, value });

    if (type === "string") {
      result.string.push({ index, type, value });
    }

    if (type === "number") {
      result.number.push({ index, type, value: Number(value) });
    }

    if (type === "boolean") {
      let validated_value;
      if (value === "1") validated_value = true;
      else if (value === "0") validated_value = false;
      else validated_value = value;

      result.boolean.push({ index, type, value: JSON.parse(validated_value) });
    }

    if (type === "user") {
      result.user.push({ index, type, value });
    }

    if (type === "channel") {
      result.channel.push({ index, type, value });
    }
  }

  return {
    result,

    /**
     * @param {number|string} findorindex
     * @param {number} [getfirstresult=0]
     */
    getChannel(findorindex, findIndex = 0) {
      let shouldFind = false;

      // If its undefined, becomes index.
      if (typeof findorindex === "undefined") shouldFind = false;
      if (typeof findorindex === "number") shouldFind = false;
      if (typeof findorindex === "string") shouldFind = true;

      if (shouldFind) {
        const results = result.channel.filter(
          (value) => value.value === findorindex,
        );

        if (findIndex === Infinity) {
          return results;
        }

        return results.at(findIndex);
      }

      return result.channel.at((findorindex ??= 0));
    },

    /**
     * @param {number|string} findorindex
     * @param {number} [getfirstresult=0]
     */
    getUser(findorindex, findIndex = 0) {
      let shouldFind = false;

      // If its undefined, becomes index.
      if (typeof findorindex === "undefined") shouldFind = false;
      if (typeof findorindex === "number") shouldFind = false;
      if (typeof findorindex === "string") shouldFind = true;

      if (shouldFind) {
        const results = result.user.filter(
          (value) => value.value === findorindex,
        );

        if (findIndex === Infinity) {
          return results;
        }

        return results.at(findIndex);
      }

      return result.user.at((findorindex ??= 0));
    },

    /**
     * @param {number} index
     * @param {boolean} ttn
     * @returns {{index:number,type:string,value:boolean|number}}
     */
    getBoolean(index = 0, ttn = false) {
      const x = result.boolean.at(index);

      if (ttn) {
        return Object.assign(x, { value: +x.value });
      } else {
        return x;
      }
    },

    /**
     * @param {number} index
     * @returns {{name:string,index:number,type:string}}
     */
    getString(index = 0) {
      return result.string.at(index);
    },

    /**
     * A custom argument cannot repeat.
     * @param {string} name
     * @returns {[{value:string,index:number,type:string}]}
     */
    getCustom(name) {
      return result.__.filter((value) => value.type === name);
    },
  };
}

module.exports = {
  validateID,
  getArgs,
};
