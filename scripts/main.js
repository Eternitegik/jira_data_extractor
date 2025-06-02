const username = 'Eternitegik';
const repo = 'jira_data_extractor';
const branch = 'main';
const path = 'Release';

fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}?ref=${branch}`)
  .then(response => response.json())
  .then(data => {
    const list = document.getElementById('file-list');
    list.innerHTML = '';

    data
      .filter(item => item.type === 'file')
      .sort((a, b) => b.name.localeCompare(a.name))
      .forEach(item => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = item.download_url;
        link.textContent = item.name;
        link.target = '_blank';
        li.appendChild(link);
        list.appendChild(li);
      });

    if (list.children.length === 0) {
      list.innerHTML = '<li>Нет файлов для отображения.</li>';
    }
  })
  .catch(error => {
    console.error('Ошибка при получении данных:', error);
    document.getElementById('file-list').innerHTML =
      '<li>Не удалось загрузить список файлов. Попробуйте позже. Сервис может временно не работать.</li>';
  });

  /*function GetAdvertisement(){
    const requestOptions = {
      method: "GET",
      redirect: "follow"
    };
    const randomParam = Math.random().toString(36).substring(7);

    fetch("https://eternitegik.github.io/VKPlayliveNow_News/advertisement?cache=" + randomParam, requestOptions)
      .then((response) => response.text())
      .then((result) => SetAdvertisement(result))
      .catch((error) => console.error(error));
}


function SetAdvertisement(result){
    var Advertisement = JSON.parse(result);
    
    console.log(Advertisement)
    
    console.log(Advertisement.data.advertisement)
     Advertisement.data.advertisement.forEach((element) => {
        console.log(element)
    })
}*/