const convertPagination = function (articles,currencyPage) {
  //分頁
  let pagination = {};
  pagination.totalResult = articles.length; //資料總比數
  pagination.perpage = 5; //一頁有幾筆資料
  pagination.totalPage = Math.ceil(pagination.totalResult / pagination.perpage); //共有幾頁
  pagination.currencyPage = Number.parseInt(currencyPage) || 1; //當前頁數
  pagination.hasPre = pagination.currencyPage > 1; //是否上一頁
  pagination.hasNext = pagination.currencyPage < pagination.totalPage; //是否下一頁
  if (pagination.currencyPage > pagination.totalPage) {
    pagination.currencyPage = pagination.totalPage;
  }
  pagination.minItem =
    pagination.currencyPage * pagination.perpage - pagination.perpage + 1;
  pagination.maxItem = pagination.currencyPage * pagination.perpage;
  let data = [];
  articles.forEach(function (item, i) {
    let itemNum = i + 1;
    if (itemNum >= pagination.minItem && itemNum <= pagination.maxItem) {
      data.push(item);
    }
  });
  return{
    pagination,data
  }
};

module.exports=convertPagination;