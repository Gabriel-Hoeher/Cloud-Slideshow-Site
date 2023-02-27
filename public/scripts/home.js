let media = [],
    mediaIndex = 0,
    gallerySize = 5,
    timer,
    pauseState = false,
    playlist = [],
    plIndex = 0,
    $player,
    isGallery = true;

AWS.config.region = 'ca-central-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: '', //pool id in here
});

window.onload = (() => { 
    let bucketName = '';        //s3 bucket name
    let s3 = new AWS.S3({
        apiVersion: '',         //date
        params: {Bucket: bucketName}
    });
    s3.listObjects(function(err, data) {
        if (err) {
            return console.log('Error listing objects: ' + err.message);
        }
        let bucketUrl = `${this.request.httpRequest.endpoint.href}${bucketName}/`;

        media = data.Contents.map(function(photo) {
            return bucketUrl + encodeURIComponent(photo.Key);
        });
        setTemplate(bucketName); 
        startPlayer();
    });
});

function startPlayer() {
    $player = $('#playlist audio');
    $.ajax({
        type: 'GET',
        url: '/getPlaylist',
        error: (err) => { console.log(err); },
        success: (data) => {            //start the player
            playlist = data; 
            $player.attr('src', playlist[plIndex]);
            $player.get(0).play();
            $player.on('ended', nextSong);
        }
    });
}

function mute() { 
    $player.prop('muted', !$player.prop("muted")); 
    $('.mute').children().children('i').toggleClass('fa-volume-off fa-volume-up');
}

function nextSong() {
    if (plIndex == playlist.length - 1) plIndex = 0;
    else plIndex += 1;
    $player.attr('src', playlist[plIndex]);
}

function setTemplate(bucketName) { 
    if (media.length <= 5) gallerySize = media.length;

    $('.uploadBtn').on('click', () => { uploadImage(bucketName); });
    $('#videoSelect').on('click', () => { switchTab(videoSelect); });
    $('#gallerySelect').on('click', () => { switchTab(gallerySelect); });
    $('#prevBtn').on('click', () => { updateImg('prev', false); });
    $('#nextBtn').on('click', () => { updateImg('next', false); });
    $('.pause').on('click', pause);
    $('.mute').on('click', mute);

    $('div .dropdown').on('click', () => { 
        $('div .dropdown').toggleClass('is-active');
    });
    
    ['#fileInput', '#fileInputMob'].forEach((input) => {
        $(input).change(() => {
            let valArray = $(input).val().split('\\');
            $('.file-name').text(valArray[valArray.length-1]);
        });
    });

    setImageState();
}

function updateImg(direction, auto) {
    if (!auto) clearTimeout(timer);
    if ((direction == 'next') && (mediaIndex != media.length - 1)) {
        mediaIndex += 1; 
    }
    else if (mediaIndex != 0) mediaIndex -= 1; 

    setImageState();
}

function gallerySelectImg(index) {
    clearTimeout(timer);
    mediaIndex = parseInt(index);
    setImageState();
}

function setImageState() { 
    let startIndex = mediaIndex - 2,
    $mainImg = $('#mainImg');
    
    resetAnim();
    $mainImg.attr('src', media[mediaIndex]); 

    if (mediaIndex <= 2) startIndex = 0;
    if (mediaIndex >= media.length - 2) startIndex = media.length - 5;
    
    $('#gallery').empty();
    for (let i=0; i<gallerySize; i++) {
        let $col = $('<div></div>'),
            $figure = $('<figure></figure>'),
            $img = $('<img></img>');

        if (i+startIndex == mediaIndex) $img.addClass('selected');
        $img.addClass('is-rounded');
        $img.attr('src', media[i+startIndex]);
        $img.attr('id', i+startIndex);
        $img.on('click', () => { gallerySelectImg($img.attr('id')); });
        
        $figure.addClass('image is-inline-block');
        $figure.append($img);

        $col.addClass('column')
        $col.append($figure);
        $('#gallery').append($col);
    }
    startTimer();
}

function startTimer() {
    if (pauseState || mediaIndex == media.length -1) return;
    timer = setTimeout(
        () => { updateImg('next', true); }, 
        5000
    );
}

function pause() {
    if (!pauseState) clearTimeout(timer);
    else startTimer();
    $('.pause').children().children('i').toggleClass('fa-pause fa-play');
    pauseState = !pauseState;
}

function resetAnim() {
    let mainImg = document.getElementById('mainImg');
    mainImg.style.animation = 'none';
    mainImg.offsetHeight;               //offset height triggers reflow
    mainImg.style.animation = null; 
}

function switchTab(tabBtn) {
    if ((isGallery && tabBtn.id == 'videoSelect') ||
        (!isGallery && tabBtn.id == 'gallerySelect')) {
        isGallery = !isGallery;
        $('#galleryTab').toggleClass('hide');
        $('#videoTab').toggleClass('hide');
        $('#gallerySelect').toggleClass('is-active');
        $('#videoSelect').toggleClass('is-active');
        mute();
    }
}

function uploadImage(bucketName) {
    let input = [
        $('#fileInput')[0].files,
        $('#fileInputMob')[0].files
    ];

    if (!input[0].length && !input[1].length) return;
    let file;
    if (!input[0].length) file = input[1][0];
    else file = input[0][0];
    
    let upload = new AWS.S3.ManagedUpload({
        params: {
            Bucket: bucketName,
            Key: file.name,
            Body: file
        }
    }).promise();

    upload.then(
        (data) => { alert(`Uploaded ${file.name}`); },
        (err) => { return alert('Upload failed') 
    });
}