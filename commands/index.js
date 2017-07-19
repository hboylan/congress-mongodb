/**
 * Invoke command script
 */
module.exports = (cmd, congress) => {

  require(`./${cmd}.js`)(congress);

};
