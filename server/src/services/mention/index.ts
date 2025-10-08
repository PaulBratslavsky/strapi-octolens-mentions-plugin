'use strict';

/**
 * mention service
 */

const { createCoreService } = require('@strapi/strapi').factories;

export default createCoreService('plugin::octalens-mentions.mention');
