cd ../../build
FILENAME=rocket.chat-"$TAG.$TRAVIS_BUILD_NUMBER.$TRAVIS_BRANCH".tgz
smv Rocket.Chat.tar.gz  "$FILENAME"
ln -s  "$FILENAME" "$TRAVIS_BRANCH.rocket.chat-v.latest.tgz"
